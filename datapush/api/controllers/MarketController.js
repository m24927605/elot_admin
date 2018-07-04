var scheduler = require('node-schedule');
const request = require('request');
const url_str = sails.config.globals.server_viabtc;
const NodeCache = require("node-cache");
const cache = new NodeCache();

///////////////////////////////////
//public data                 /////
///////////////////////////////////

function getMarketHistory(req, res, container) {


    var headers = {
        "content-type": "application/json"
    };
    var options = {
        url: url_str,
        method: 'POST',
        headers: headers,
        json: {
            id: 13,
            method: "market.deals",
            params: [req.body.market, 10, 1]
        }
    };

    request.post(options, function (error, response, body) {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getMarketHistory error message:" + body.error.message);
            container.error = body.error;
            returnResult(req, res, container);
            return
        } else {
            container.markethistory = body.result;
            getOrderBookBuy(req, res, container);
        }
    });
}



function getOrderBookBuy(req, res, container) {

    var headers = {
        "content-type": "application/json"
    };
    var options = {
        url: url_str,
        method: 'POST',
        headers: headers,
        json: {
            id: 11,
            method: "order.book",
            params: [req.body.market, 2, 0, 50]
        }
    };

    request.post(options, function (error, response, body) {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getOrderBookBuy error message:" + body.error.message);
            container.error = body.error;
            returnResult(req, res, container);
            return
        } else {
            container.orderBookBuy = body.result;
            getOrderBookSell(req, res, container);
        }
    });
}

function getOrderBookSell(req, res, container) {
  
    var headers = {
        "content-type": "application/json"
    };
    var options = {
        url: url_str,
        method: 'POST',
        headers: headers,
        json: {
            id: 11,
            method: "order.book",
            params: [req.body.market, 1, 0, 50]
        }
    };

    request.post(options, function (error, response, body) {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getOrderBookSell　error message:" + body.error.message);
            container.error = body.error;
            returnResult(req, res, container);
            return
        } else {
            container.orderBookSell = body.result;
            //cache.set("getOrderBookSell_" + req.body.market, body.result, 1);
            getMarketData(req, res, container);
        }
    });
}



function getMarketData(req, res, container) {
    //console.log("getMarketData");
    var headers = {
        "content-type": "application/json"
    };
    var options = {
        url: url_str,
        method: 'POST',
        headers: headers,
        json: {
            id: 12,
            method: "market.kline",
            params: [
                req.body.market,
                parseInt((req.body.start + "").substring(0, 10), 10),
                parseInt((req.body.end + "").substring(0, 10), 10),
                parseInt(req.body.interval, 10)
            ]
        }
    };

    request.post(options, function (error, response, body) {
        if (!body) {
            return;
        }

        if (body.error) {
            console.log(options);
            console.log("getMarketData　error message:" + body.error.message);
            container.error = body.error;
            returnResult(req, res, container);
            return
        } else {
            result = [];
            for (var i = 0; i < body.result.length; i++) {
                var tmp = [];
                tmp.push(body.result[i][0] * 1000);
                tmp.push(parseFloat(body.result[i][1]));
                tmp.push(parseFloat(body.result[i][2]));
                tmp.push(parseFloat(body.result[i][3]));
                tmp.push(parseFloat(body.result[i][4]));
                tmp.push(parseFloat(body.result[i][5]));
                tmp.push(parseFloat(body.result[i][6]));

                result.push(tmp);
            }
            container.market = result;
            getHeaderData(req, res, container);
        }
    });
}

function getHeaderData(req, res,container) {

    var cache_data=cache.get("getHeaderData_"+req.body.market+""+parseInt(req.body.period, 10));
    if(cache_data)
    {
        //console.log("use getHeaderData cache_data");
        container.header=cache_data;
        returnResult(req, res,container);
        return;
    }
    //console.log("getHeaderData");
    var headers = {
        "content-type": "application/json"
    };
    var options = {
        url: url_str,
        method: 'POST',
        headers: headers,
        json: {
            id: 66,
            method: "market.status",
            params: [req.body.market, parseInt(req.body.period, 10)]
        }
    };
    //console.log(options);
    request.post(options, function(error, response, body) {
        if (!body) {
            return;
        }

        if (body.error) {
            console.log("error message:" + body.error.message);
            container.error = body.error;
            returnResult(req, res, container);
            return
        } else {
            container.header = body.result;
            cache.set( "getHeaderData_"+req.body.market+""+parseInt(req.body.period, 10), body.result,1 );
            returnResult(req, res,container);

        }
    });

}

function returnResult(req, res, container) {
    //var ret = {};
    //console.log("returnResult");
    //ret.container = container;
    //console.log(container);
    res.json(container);
}
module.exports = {
    create: function (req, res) {
        var container = {};
        getMarketHistory(req, res, container);
    },
    subscribe: function (req, res) {
        console.log(req.query.param);
        sails.sockets.join(req, req.query.param);
        res.json(req.query.param);
    }
};