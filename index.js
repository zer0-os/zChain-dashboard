import {Meow} from "./meow.js";
import {ZScreen}  from "./zScreen.js";
import Web3 from 'web3';
import chalk from 'chalk';
import fs from "fs";
import pkg from 'p-iteration';
import {IP2Location} from "ip2location-nodejs";
import {GraphQLClient,gql} from 'graphql-request'
const {forEach} = pkg;

let myScreen,myMeow,myPeerId,graphClient;
let connectedPeers = [];
let currentInterval;
let ip2location;
let web3;
let ethAddresses;
let graphEndpoint ="https://api.thegraph.com/subgraphs/name/zer0-os/zns";
(async() => {
	try {
		myScreen = new ZScreen();
	        myScreen.screen.render()
		routeOutput();
		web3 = new Web3(Web3.givenProvider)
		myMeow = await new Meow("dashboard")
		myPeerId = myMeow.zchain.node.peerId.toB58String()
		let nodeEthDefaultAddress = await myMeow.store.getPeerEthAddressAndSignature(myPeerId)
        	if(nodeEthDefaultAddress && nodeEthDefaultAddress["defaultAddress"])
                	console.log(nodeEthDefaultAddress["defaultAddress"])
		infosInterval()
		currentInterval = setInterval(infosInterval,10000)
		handleConnections();
		tryAnimation()
		ip2location = new IP2Location();
		ip2location.open("./ip2loc/ip2location.bin");
		graphClient = new GraphQLClient(graphEndpoint);
		await myScreen.menuBox.on("element click",async function(element,mouse){
			if(String(element.content).includes("DETAILS")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				infosInterval()
				currentInterval = setInterval(infosInterval,10000)
			}
			else if(String(element.content).includes("CONNECTED")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				connectedInterval()
				currentInterval = setInterval(connectedInterval,10000)
			}
			else if(String(element.content).includes("ADDRESS BOOK")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				myScreen.showAddressBook(await myMeow.getFollowedPeers(),connectedPeers)
				handleAddressBookClick()
			}
			else if(String(element.content).includes("ETHEREUM ADDRESS")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				myScreen.showEthereum(myPeerId.toString())
				handleEthVerify()
			}
			else if(String(element.content).includes("VERIFIED ADDRESSES")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				try{
					ethAddresses = await myMeow.store.getPeerEthAddressAndSignature(myPeerId)
				}catch(e){}
				myScreen.showVerifiedAddresses(ethAddresses)
				handleEthAddressClick()
			}
			else if(String(element.content).includes("CHANNELS")){
				if(currentInterval !== undefined)
					clearInterval(currentInterval)
				let followedChannels = await myMeow.getFollowedChannels()
				myScreen.showChannels(followedChannels);
				handleFollowChannelSubmit()
				handleFetchChannelFeed()
			}
		});
	} catch(e){}
})();

async function handleSendInChannel(){
	myScreen.sendMeowChannelSubmit.on("click",async()=>{
		let channelName = myScreen.sendMeowChannelSubmit.name
		let msgToSend = myScreen.sendMeowChannelText.content.toString()
		if(msgToSend && msgToSend !==""){
			await myMeow.sendMeow(msgToSend+" "+channelName)
			let channelFeed = await myMeow.getChannelFeed(channelName,100)
                        myScreen.showChannelFeed(channelFeed,channelName)
                        handleSendInChannel()
		}
	});
}
async function handleFetchChannelFeed(){
	myScreen.followedChannelsTable.on("element click",async(element,mouse) =>{
		let channelName = element.content.toString().replace(/ /g,'')
		if(channelName && channelName !==""){
			let channelFeed = await myMeow.getChannelFeed(channelName,100)
			myScreen.showChannelFeed(channelFeed,channelName)
			handleSendInChannel()
		}
	});
}
async function handleFollowChannelSubmit(){
	myScreen.followChannelSubmit.on("click", async function(){
		let channelName = myScreen.followChannelValue.value.toString()
		if(channelName && channelName !==""){
			await myMeow.followChannel(channelName)
			let followedChannels = await myMeow.getFollowedChannels()
			myScreen.showChannels(followedChannels)
			myScreen.dynamicBox.focus()
			handleFollowChannelSubmit()
			handleFetchChannelFeed()
		}
	});
}
async function handleEthAddressClick(){
	myScreen.verifiedEthAddressesTable.on("element click",async(element,mouse)=>{
		let selectedAddress = element.content.toString().replace(/ /g,'');
		if(web3.utils.isAddress(selectedAddress)){
			let ownedDomains = await getZnaFromSubgraph(selectedAddress)
			if(ownedDomains)
				myScreen.showOwnedDomains(ownedDomains)
			else
				console.log(chalk.red("Not owning any znas"))
		}
	});
}
async function getZnaFromSubgraph(address) {
    address = address.toLowerCase()
    const graphQuery = gql`{
		account(id:"${address}"){
			ownedDomains {
				id
				name
			}
		}
	}`
    var ownedDomains = await graphClient.request(graphQuery)
    if (ownedDomains.account && ownedDomains.account.ownedDomains)
        return ownedDomains.account.ownedDomains
}
async function handleEthVerify(){
	myScreen.verifyEthButton.on('click', async function(){
		let ethAddress = myScreen.ethAddressTextBox.value.toString()
		let ethSig = myScreen.ethSigTextBox.value.toString()
		if(ethAddress && web3.utils.isAddress(ethAddress)){
			if(ethSig){
				try{
					let duplicated = false;
					let ethData = await myMeow.store.getPeerEthAddressAndSignature(myPeerId)
					if(ethData && ethData["meta"]){
	                			ethData["meta"].forEach(data=>{
							if(data["ethAddress"] === web3.utils.toChecksumAddress(ethAddress)) duplicated =true;
                				});
					}
					if(!duplicated){
						await myMeow.store.addEthAddressAndSignature(ethAddress,ethSig)
						console.log(chalk.red("Added a new ethereum address :"+ethAddress))
						myScreen.showEthereum(myPeerId.toString())
                                		handleEthVerify()
					} else {
						console.log(chalk.red("Address "+ethAddress+" already exists"));
						myScreen.showEthereum(myPeerId.toString())
                                		handleEthVerify()
					}
				}catch(e){}
			}
		}
	});
}
async function tryAnimation(){
	let animationArray = myScreen.meowAsci.toString().split("\n")
	while(1){
		for(let index in animationArray){
			myScreen.titleText.log("     "+animationArray[index].toString())
			myScreen.titleText2.log("     "+animationArray[index].toString())
			myScreen.screen.render()
			await sleep(100);
		}
	}
}
async function connectedInterval(){
	myScreen.showConnected(connectedPeers)
        handleConnectedClick()
}
async function infosInterval(){
	let followedPeersCount = Object.entries(myMeow.store.meowDbs.followingZIds.all).length
        let followedChannelsCount = Object.keys(await myMeow.getFollowedChannels()).length
	let onGoingMeow =""
	if(myScreen.sendMeowText)
		onGoingMeow = myScreen.sendMeowText.content
        myScreen.showInfos(myPeerId,"",followedPeersCount,followedChannelsCount,connectedPeers.length)
	if(onGoingMeow != ""){
		myScreen.sendMeowText.setValue(onGoingMeow)
		myScreen.sendMeowText.focus()
	}
	myScreen.sendMeowSubmit.on('click',async function(){
		let meowText = myScreen.sendMeowText.content.toString()
		if(meowText !== undefined && meowText !== ""){
			await myMeow.sendMeow(meowText);
			myScreen.sendMeowText.setContent("")
			infosInterval()
		}
	});
}
async function handleAddressBookClick(){
	myScreen.followedPeersTable.on("element click",async(element,mouse)=>{
		let regex = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/;
		if(element.content.match(regex)){
			let selectedPeerId = element.content.match(regex)
			let selectedPeerName =""
			let followedPeers = await myMeow.getFollowedPeers()
                        followedPeers.forEach(peer=>{
                                if(peer["peerId"] == selectedPeerId){
                                         if(peer["displayName"] !== undefined) selectedPeerName = peer["displayName"]
                                }
                        });
			let peerFeed = await myMeow.getPeerFeed(selectedPeerId,50)
                        myScreen.showPeer(selectedPeerId,selectedPeerName,peerFeed)
                        handleNameChange()
		}
	});
}
async function handleConnectedClick(){
	myScreen.connectedTable.on("element click",async(element,mouse)=>{
	        let regex = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/;
                if(element.content.match(regex)){
			if(currentInterval !== undefined)
				clearInterval(currentInterval)
	                let selectedPeerId = element.content.match(regex)
                        let selectedPeerName =""
                        connectedPeers.forEach(peer=>{
        	                if(peer["peerId"] == selectedPeerId){
                	                 if(peer["peerName"] !== undefined) selectedPeerName = peer["peerName"]
                                }
                        })
			let peerFeed = await myMeow.getPeerFeed(selectedPeerId,50)
                        myScreen.showPeer(selectedPeerId,selectedPeerName,peerFeed)
                        handleNameChange()
        	}
        });

}
async function handleNameChange(){
	myScreen.peerNameSubmit.on("click",async function(){
		let targetPeerId = myScreen.peerId.content.toString()
		let targetPeerName = myScreen.peerName.content.toString()
		if(targetPeerName !==""){
			await myMeow.followZId(targetPeerId)
			await myMeow.store.dbs.addressBook.set(targetPeerId,targetPeerName)
			connectedPeers.forEach(peer =>{
				if(peer["peerId"] == targetPeerId)
					peer["peerName"] = targetPeerName
			});
			clearInterval(currentInterval)
			connectedInterval()
			currentInterval= setInterval(connectedInterval,10000)
			myScreen.menuBox.select(1)
		}
	});
	myScreen.peerUnfollowButton.on("click",async function(){
		let targetPeerId = myScreen.peerId.content.toString();
		await myMeow.unfollowZId(targetPeerId)
		connectedPeers.forEach(peer=>{
			if(peer["peerId"] == targetPeerId)
				peer["peerName"]=""
		});
		clearInterval(currentInterval)
		connectedInterval()
                currentInterval = setInterval(connectedInterval,10000)
		myScreen.menuBox.select(1)
	});
	myScreen.peerEthAddressesButton.on("click",async function(){
		let targetPeerId = myScreen.peerId.content.toString();
		let followed = false;
		let followedPeers = await myMeow.getFollowedPeers()
                followedPeers.forEach(peer=>{
                	if(peer["peerId"] == targetPeerId)
				followed= true;
                });
		if(followed){
			let addressesValid = true;
			let ethAddresses = await myMeow.store.getPeerEthAddressAndSignature(targetPeerId)
			if(ethAddresses && ethAddresses["meta"] &&  Object.entries(ethAddresses["meta"]).length > 0){
				ethAddresses["meta"].forEach(address=>{
					if(web3.utils.isAddress(address["ethAddress"])){
						let recoveredAddress = web3.eth.accounts.recover(targetPeerId,address["sig"])
						if(recoveredAddress !== address["ethAddress"])
							addressesValid =false;
					}
				});
				if(addressesValid){
					myScreen.showVerifiedAddresses(ethAddresses)
					handleEthAddressClick();
					myScreen.menuBox.select(4)
				}
			}else
				console.log(chalk.red("Peer did not verify any eth address"));
		}else{
			console.log(chalk.red("You need to be following this peer to see the ethereum address associated"));
		}
	});
}
async function handleConnections(){
	myMeow.zchain.peerDiscovery.onConnect(async(connection) => {
		let connectionPeerId = connection.remotePeer.toB58String()
		let connectionIp
		if (connection.remoteAddr) {
			connectionIp = connection.remoteAddr.toString().split("/")[2]
			var connectionLat = ip2location.getLatitude(connectionIp)
            		var connectionLon = ip2location.getLongitude(connectionIp)
            		myScreen.mapBox.addMarker({
                		"lon": connectionLon,
                		"lat": connectionLat,
                		color: "red",
                		char: "X"
            		})
		}
		let peerFn = await myMeow.store.getNameAndPeerID(connectionPeerId)
		let available = false
		connectedPeers.forEach(peer =>{
			if(peer["peerId"] == connectionPeerId){
				available = true
			}
		});
		if(!available)
			connectedPeers.push({"peerId":connectionPeerId,"peerIp":connectionIp,"peerName":peerFn[1]})
	});
	myMeow.zchain.peerDiscovery.node.connectionManager.on("peer:disconnect",async(connection) =>{
		let connectionPeerId = connection.remotePeer.toB58String()
		connectedPeers = connectedPeers.filter((item) => item["peerId"] !== connectionPeerId);
		console.log("Disconnected from : "+connectionPeerId);
	});
}
async function routeOutput(){
	 for (let func in console) {
                //if (func == "error") continue;
                if (func == "log"  || func == "error"){
                        console[func] = function(text,extra) {
                                if(extra === undefined) extra="";
                                if(text.length > 0){
                                        myScreen.generalLogBox.log("  "+text+extra)
                                }
                        }
                }
                else
                        console[func] = function() {};
        }
}
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
