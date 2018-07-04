var scheduler             = require('node-schedule');
const request             = require('request');
const url_str             = sails.config.globals.server_viabtc;
var   period              = 86640;
var market_config         = sails.config.globals.market;
var interval_config       = sails.config.globals.interval;


///////////////////////////////////
//public data                 /////
///////////////////////////////////




function MarketClass(market_param,start,end, container)
{
    this.market_param   = market_param;
    this.start          = start;
    this.end            = end;
    this.container      = container;
    //this.flag           = flag;

    this.exe = function(){
        this.getMarketHistory(this.market_param,this.start,this.end, this.container)
    }


    this.getMarketHistory = function(market_param,start,end, container) {


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
            params: [market_param, 10, 1]
        }
    };

    request.post(options,  (error, response, body)=> {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getMarketHistory error message:" + body.error.message);
            container.error = body.error;
            this.returnResult(market_param,start,end, container);
            return
        } else {
            container.markethistory = body.result;
            this.getOrderBookBuy(market_param,start,end, container);
        }
    });
    }


 this.getOrderBookBuy = function (market_param,start,end, container) {

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
            params: [market_param, 2, 0, 50]
        }
    };

    request.post(options,  (error, response, body)=> {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getOrderBookBuy error message:" + body.error.message);
            container.error = body.error;
            this.returnResult(market_param,start,end, container);
            return
        } else {
            container.orderBookBuy = body.result;
            this.getOrderBookSell(market_param,start,end, container);
        }
    });
}

this.getOrderBookSell = function (market_param,start,end, container) {
  
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
            params: [market_param, 1, 0, 50]
        }
    };

    request.post(options,  (error, response, body)=> {
        if (!body) {
            return;
        }
        if (body.error) {
            console.log(options);
            console.log("getOrderBookSell　error message:" + body.error.message);
            container.error = body.error;
            this.returnResult(market_param,start,end, container);
            return
        } else {
            container.orderBookSell = body.result;
            this.getHeaderData(market_param,start,end, container);
        }
    });
}


this.getHeaderData =function (market_param,start,end, container) {

    
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
            params: [market_param, parseInt(period, 10)]
        }
    };
    //console.log(options);
    request.post(options, (error, response, body)=> {
        if (!body) {
            return;
        }

        if (body.error) {
            console.log("error message:" + body.error.message);
            container.error = body.error;
            this.returnResult(market_param,start,end, container);
            return
        } else {
            container.header = body.result;
            // cache.set( "getHeaderData_"+req.body.market+""+parseInt(period, 10), body.result,1 );
            this.getMarketDataFromDifferentInterval(market_param,start,end, container);

        }
    });

}

this.getMarketDataFromDifferentInterval= function(market_param,start,end, container){
   for (var j = interval_config.length - 1; j >= 0; j--) 
   {
        var interval_param = interval_config[j];
        var marketIntervalDataObj  = new marketIntervalData(market_param, interval_param,start,end, container);
        marketIntervalDataObj.exe();
    }
                        
}

}

function marketIntervalData(market_param,interval_param,start,end, container)
{
    this.market_param   = market_param;
    this.interval_param = interval_param;
    this.start          = start;
    this.end            = end;
    this.container      = container;

    this.exe = function()
    {
        this.getMarketData(
            this.market_param, 
            this.interval_param,
            this.start,
            this.end, 
            this.container);
    }


this.getMarketData =function(market_param, interval_param,start,end, container) {
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
                market_param,
                parseInt((start + "").substring(0, 10), 10),
                parseInt((end + "").substring(0, 10), 10),
                parseInt(interval_param, 10)
            ]
        }
    };

    request.post(options,  (error, response, body)=> {
        if (!body) {
            return;
        }

        if (body.error) {
            console.log(options);
            console.log("getMarketData　error message:" + body.error.message);
            container.error = body.error;
            return;
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
            this.returnResult(market_param,interval_param,start,end, container);

        }
    });
}


    this.returnResult=function(market_param,interval_param,start,end, container) {
        console.log( market_param+"_"+interval_param );   
        sails.sockets.broadcast(market_param+"_"+interval_param,market_param+"_"+interval_param,container);
        
    }

}


function entryPoint(market){
    this.market         = market;
    this.heart_beat     = new Date().getTime();

    //推送全局数据，使用restful API废弃  start；
    // this.GetDateStr = function(AddDayCount) {
    //   var dd = new Date(); 
    //   dd.setDate(dd.getDate()-AddDayCount);
    //   return dd.getTime(); 
    // }
    
    // this.pushAllData= function(){
    //      var container = {};
    //      var end       = new Date().getTime();
    //      var start     = this.GetDateStr(this.interval_param);
    //      var marketObj = new MarketClass(
    //         this.market, 
    //         this.interval,
    //         start,
    //         end, 
    //         container,
    //         true
    //         );
    //      marketObj.exe();
    // }
    //推送全局数据，使用restful API废弃  end

    this.pushIncreaseData= function(){
         
         scheduler.scheduleJob("*/1 * * * * *", ()=>{
            var container = {};
            this.start      = this.heart_beat;
            this.end        = new Date().getTime();
            this.heart_beat = this.end;

         var marketObj = new MarketClass(
            this.market, 
            this.start,
            this.end, 
            container);
         marketObj.exe();
     })

    }
  

}
 



module.exports = {

       exeMarketService: function() {
                var marketTmp;
                for (var i = market_config.length - 1; i >= 0; i--) {
                        marketTmp = market_config[i];
                        var entrypoint = new entryPoint(marketTmp);
                        //推送全局数据，使用restful API废弃  start；
                        //entrypoint.pushAllData();
                        //推送全局数据，使用restful API废弃  end
                        entrypoint.pushIncreaseData();
                   // }
                }       
      }
}















