import app from './app' ;
import { Server } from 'socket.io';

import { CryptoOrderList, AllNotifications, CryptoPairList, MarketTradeList } from './app/services/SocketService';

import { isset } from './app/utils/Helper';

const server = app.listen( process.env.PORT || 5050 , () => {
    console.log('Server is listening on ', process.env.PORT || 5050) ;
});

const socketIo = new Server(server, {
    cors : {
        origin : '*'
    }
})

global.io = socketIo ;

socketIo.on("connection", async (socket) => {
    console.log("New client connected: " + socket.id);
  
    socket.emit("getId", socket.id);
    
    socket.on("Request: Notifications", async (msg) => {
        let notificationList = await AllNotifications() ;
        socketIo.emit("Response: Notifications",  notificationList );
    });

    socket.on(`Request: Crypto Pair List`, async (clientId, msg) => {
        let cryptoPairList = await CryptoPairList() ;

        socketIo.emit("Response: Crypto Pair List" , cryptoPairList) ;
    });

    socket.on("Request: Crypto Order List", async(clientId, msg) => {
        if(isset(msg.crypto_id) && isset(msg.pair_id)) {
            let cryptoOrderList = await CryptoOrderList(msg.crypto_id, msg.pair_id) ;

            // This help make server send data to only you.
            // socketIo.to(clientId).emit("Response: Crypto Order List", clientId, cryptoOrderList) ;

            socketIo.emit(`Response: Crypto Order List(${msg.crypto_id}, ${msg.pair_id})`,  cryptoOrderList) ;
        }
    }) ;

    socket.on("Request: Market Trade List", async(clientId, msg) => {
        if(isset(msg.crypto_id) && isset(msg.pair_id)) {
            let marketTradeList = await MarketTradeList(msg.crypto_id, msg.pair_id) ;

            socketIo.emit(`Response: Market Trade List(${msg.crypto_id}, ${msg.pair_id})`,  marketTradeList) ;
        }
    }) ;

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
});