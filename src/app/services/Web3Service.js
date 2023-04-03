import Web3 from 'web3' ;
import { ethers } from 'ethers' ;
import ERC20_ABI from '../static/Erc20ABI.json' ;

const web3 = new Web3(new Web3.providers.HttpProvider( process.env.WEB3_PROVIDER ));

export const WithdrawERC20Crypto = async (token_address, token_symbol, withdraw_amount, toAccount) => {
    
    const etherReceiver = new web3.eth.Contract(ERC20_ABI, token_address);

    const ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY ;
    const ADMIN_WALLET_ADDR = process.env.ADMIN_WALLET_ADDR ;

    const symbol = ethers.utils.formatBytes32String(token_symbol) ;
    const amount = ethers.utils.parseUnits(withdraw_amount).toString() ;

    const nonce = await web3.eth.getTransactionCount(ADMIN_WALLET_ADDR, 'latest'); // nonce starts counting from 0

    console.log('Exchange withdraw transaction nonce: ', nonce) ;

    let resultTx = false;

    const tx = {
        to : token_address,
        nonce: nonce,
        gasLimit: 3141592,
        gasUsed: 21662,
        data : etherReceiver.methods.transfer(toAccount, amount).encodeABI()
    }

    await web3.eth.accounts.signTransaction(tx, ADMIN_WALLET_PRIVATE_KEY).then(async signed => {
        await web3.eth.sendSignedTransaction(signed.rawTransaction).then(receipt => {
            console.log("success withdraw") ;
            resultTx = true ;
        }).catch(error => {
            console.log("error withdraw" , error) ;
            resultTx = false ;
        })
    }).catch(err => {
        console.log(err);
        resultTx = false ;
    });

    return resultTx ;
}

export const WithdrawEthereum = async (toAccount, withdraw_amount) => {

    const ADMIN_WALLET_PRIVATE_KEY = process.env.ADMIN_WALLET_PRIVATE_KEY ;
    const ADMIN_WALLET_ADDR = process.env.ADMIN_WALLET_ADDR ;

    const nonce = await web3.eth.getTransactionCount(ADMIN_WALLET_ADDR, 'latest'); // nonce starts counting from 0
    
    console.log('Exchange withdraw transaction nonce: ', nonce) ;

    const amount = ethers.utils.parseEther(withdraw_amount) ;

    let resultTx = false;

    const tx = {
        to : toAccount,
        nonce: nonce,
        gasLimit: 3141592,
        gasUsed: 21662,
        value : amount
    }

    await web3.eth.accounts.signTransaction(tx, ADMIN_WALLET_PRIVATE_KEY).then(async signed => {
        await web3.eth.sendSignedTransaction(signed.rawTransaction).then(receipt => {
            console.log("success withdraw") ;
            resultTx = true ;
        }).catch(error => {
            console.log("error withdraw", error) ;
            resultTx = false;
        })
    }).catch(err => {
        console.log(err) ;
        resultTx = false ;
    })

    return resultTx ;
}