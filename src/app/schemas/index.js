import SchemaService from "../services/SchemaService";
import AccountSchema from "./AccountSchema";
import WalletSchema from "./WalletSchema";
import CryptoSchema from './CryptoSchema' ;
import NotificationSchema from './NotificationSchema' ;
import OrderSchema from './OrderSchema' ;
import PayOrderSchema from './PayorderSchema' ;
import ProfileSchema from "./ProfileSchema";
import UserSchema from "./UserSchema";

export const Accounts = new SchemaService(AccountSchema) ;
export const Wallets =  new SchemaService(WalletSchema) ;
export const Cryptos = new SchemaService(CryptoSchema) ;
export const Notifications =  new SchemaService(NotificationSchema) ;
export const Orders = new SchemaService(OrderSchema) ;
export const PayOrders = new SchemaService(PayOrderSchema) ;
export const Profiles = new SchemaService(ProfileSchema);
export const Users = new SchemaService(UserSchema) ;