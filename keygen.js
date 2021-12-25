const web3 = require("@solana/web3.js");

const userWallet=web3.Keypair.generate();
console.log(userWallet);