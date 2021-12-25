const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const web3 = require("@solana/web3.js");
const { getReturnAmount, totalAmtToBePaid, randomNumber } = require('./helper');
const {getWalletBalance,transferSOL,airDropSol}=require("./solana");

const connection=new web3.Connection(web3.clusterApiUrl("devnet"),"confirmed");
//For checking whether the connection is successfully made
// console.log(connection);


const userSecretKey = [26, 117, 102, 101, 188, 189, 237,  39, 157, 156,  46,
    42, 248, 130, 136, 253,  44,   2, 246,  70, 183,  72,
    51,  67, 203,  79, 198, 156, 138, 213, 237, 175,  65,
   120, 242,  99, 202, 134, 237, 213,   7, 174, 242,  28,
    80, 149, 107,  56, 150,  58,  80, 244,  47, 239, 217,
    53, 203, 156,  90,   3, 165, 168,  54, 142];

const userWallet=web3.Keypair.fromSecretKey(Uint8Array.from(userSecretKey));
console.log("userWallet publicKey");
console.log(userWallet.publicKey.toBase58());
// solana airdrop 1 5QaU3oDdk2D3vi7h9GpVvNqhxdKSHnnpQrdxhg2ZNnaR --url https://api.devnet.solana.com

//Treasury
const treasurySecretKey = [201, 239,  17, 106,  72, 157, 215, 125, 124,  71, 116,
    156, 205, 175,   4, 168, 173, 153,  30, 117, 177, 193,
    172,  25,  58, 221,  97,  81,  73,  48, 115,  27,  21,
     13,  80, 215, 168, 102,  36, 108,  91, 241,  59, 198,
    115,  88, 183, 177,  35, 252, 190, 251, 238,  26, 229,
     14,  41, 221, 162, 119, 184,  49,  44,  17]

const treasuryWallet=web3.Keypair.fromSecretKey(Uint8Array.from(treasurySecretKey));
console.log("treasuryWallet publicKey");
console.log(treasuryWallet.publicKey.toBase58());


const init = () => {
    console.log(
        chalk.green(
        figlet.textSync("YUHAN SOL Stake", {
            font: "Standard",
            horizontalLayout: "default",
            verticalLayout: "default"
        })
        )
    );
    console.log(chalk.yellow`The max bidding amount is 2.5 SOL here`);
};

const askQuestions = () => {
    const questions = [
        {
            name: "SOL",
            type: "number",
            message: "What is the amount of SOL you want to stake?",
        },
        {
            type: "rawlist",
            name: "RATIO",
            message: "What is the ratio of your staking?",
            choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
            filter: function(val) {
                const stakeFactor=val.split(":")[1];
                return stakeFactor;
            },
        },
        {
            type:"number",
            name:"RANDOM",
            message:"Guess a random number from 1 to 5 (both 1, 5 included)",
            when:async (val)=>{
                if(parseFloat(totalAmtToBePaid(val.SOL))>5){
                    console.log(chalk.red`You have violated the max stake limit. Stake with smaller amount.`)
                    return false;
                }else{
                    // console.log("In when")
                    console.log(`You need to pay ${chalk.green`${totalAmtToBePaid(val.SOL)}`} to move forward`)
                    const userBalance=await getWalletBalance(userWallet.publicKey.toString())
                    if(userBalance<totalAmtToBePaid(val.SOL)){
                        console.log(chalk.red`You don't have enough balance in your wallet`);
                        return false;
                    }else{
                        console.log(chalk.green`You will get ${getReturnAmount(val.SOL,parseFloat(val.RATIO))} if guessing the number correctly`)
                        return true;    
                    }
                }
            },
        }
    ];
    return inquirer.prompt(questions);
};


const gameExecution=async ()=>{
    init();
    const generateRandomNumber=randomNumber(1,5);
    console.log("Generated number",generateRandomNumber);
    const answers=await askQuestions();
    if(answers.RANDOM){
        const paymentSignature=await transferSOL(userWallet,treasuryWallet,totalAmtToBePaid(answers.SOL))
        console.log(`Signature of payment for playing the game`,chalk.green`${paymentSignature}`);
        if(answers.RANDOM===generateRandomNumber){
            //AirDrop Winning Amount
            await airDropSol(treasuryWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)));
            //guess is successfull
            const prizeSignature=await transferSOL(treasuryWallet,userWallet,getReturnAmount(answers.SOL,parseFloat(answers.RATIO)))
            console.log(chalk.green`Your guess is absolutely correct`);
            console.log(`Here is the price signature `,chalk.green`${prizeSignature}`);
        }else{
            //better luck next time
            console.log(chalk.yellowBright`Better luck next time`)
        }
    }
}

gameExecution();