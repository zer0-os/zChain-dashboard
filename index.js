
import {Meow} from "./meow.js";
import {ZScreen}  from "./zScreen.js";
import Web3 from 'web3';
import chalk from 'chalk';
import fs from "fs";
import pkg from 'p-iteration';
import {IP2Location} from "ip2location-nodejs";
import {GraphQLClient,gql} from 'graphql-request'
import path from "path";
import os from "os";
const {forEach} = pkg;

let myScreen,myMeow,myPeerId,graphClient;
let connectedPeers = [];
let currentInterval;
let ip2location;
let web3;
let ethAddresses,nodeEthDefaultAddress;
let graphEndpoint ="https://api.thegraph.com/subgraphs/name/zer0-os/zns";
(async() => {
	try {
		const myArgs = process.argv.slice(2);
		myScreen = new ZScreen();
                myScreen.screen.render()
                routeOutput();
		if(myArgs.length>0){
                        if(myArgs[0] == "force"){
				
				fs.rmSync(path.join(os.homedir(), '/.zchain/db/dashboard'), {force: true, recursive: true});
			}
                }

		web3 = new Web3(Web3.givenProvider)
		myMeow = await new Meow("dashboard")
		myPeerId = myMeow.zchain.node.peerId.toB58String()
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
					ethAddresses = await myMeow.zchain.zStore.getPeerEthAddressAndSignature(myPeerId)
				}catch(e){}
				myScreen.showVerifiedAddresses(ethAddresses)
				handleEthAddressClick()
			}
			else if(String(element.content).includes("MY NETWORKS")){
				if(currentInterval !== undefined)
                                        clearInterval(currentInterval)
				let availableNetworks = await myMeow.getMyNetworks()
				myScreen.showMyNetworks(availableNetworks)
				handleNetworkClick()
				handleCreateNetwork()
			}
			else if(String(element.content).includes("ALL NETWORKS")){
                                if(currentInterval !== undefined)
                                        clearInterval(currentInterval)
                                let allNetworks = await myMeow.getNetworkList()
                                myScreen.showAvailableNetworks(allNetworks)
				handleAvailableNetworksClick();
                        }

			else if(String(element.content).includes("TWITTER")){
				if(currentInterval != undefined)
					clearInterval(currentInterval)
				await showTwitterSettings()
			}
		});
	} catch(e){}
})();

async function handleAvailableNetworksClick(){
	myScreen.allNetworksTable.on("element click",async(element,mouse)=>{
		let networkName = element.content.toString().replace(/ /g,'')
                if(networkName && networkName !==""){
			try{
				await myMeow.joinNetwork(networkName);
				let networks = await myMeow.getMyNetworks();
                        	let networkChannels;
                        	if(networks){
                                	networks.forEach(network =>{
                                        	if(networkName == network["network"])
                                                	networkChannels = network["channels"];
                                	});
                        	}
                        	myScreen.showChannels(networkChannels,networkName)
                        	handleFollowChannelSubmit()
                        	handleFetchChannelFeed()

			}catch(e){console.log(e)}
		}
	});
}
async function showTwitterSettings(){
	try{
		let twitterAuthData = await myMeow.getTwitterAuthLink()
		if(twitterAuthData && twitterAuthData["url"]){
			let twitterAuthUrl = twitterAuthData["url"]
			myScreen.showTwitterSettings(twitterAuthUrl)
			myScreen.twitterPinSubmit.on("click",async()=>{
				let twitterPin = myScreen.twitterPinInput.content.toString()
				if(twitterPin && twitterPin.length == 7){
					await myMeow.enableTwitterUsingPIN(twitterAuthData,twitterPin)
					showTwitterSettings()
				}
			});
		}
		myScreen.twitterDisableSubmit.on("click",async()=>{
			await myMeow.disableTwitter()
			showTwitterSettings()
		});
	}catch(e){}
}
async function handleCreateNetwork(){
	myScreen.createNetworkSubmit.on("click",async()=>{
		let networkName = myScreen.createNetworkValue.content.toString()
		if(networkName && networkName !== ""){
			try{
				let ethData = await myMeow.zchain.zStore.getPeerEthAddressAndSignature(myPeerId)
				if(ethData && ethData["meta"]){
					await myMeow.createNetwork(networkName,[])
					myScreen.showChannels([],networkName)
					handleFollowChannelSubmit()
					handleFetchChannelFeed();
				}else{
					console.log("Verify your eth address to create a network");
				}
			}catch(e){console.log("Creating network failed");}
		}
	});
}
async function handleNetworkClick(){
	myScreen.availableNetworksTable.on("element click",async(element,mouse)=>{
		let networkName = element.content.toString().replace(/ /g,'')
		if(networkName && networkName !==""){
			let networks = await myMeow.getMyNetworks();
			let networkChannels;
			if(networks){
				networks.forEach(network =>{
					if(networkName == network["network"])
						networkChannels = network["channels"];
				});
			}
			myScreen.showChannels(networkChannels,networkName)
			handleFollowChannelSubmit()
			handleFetchChannelFeed()
		}
	});
}
async function handleSendInChannel(){
	myScreen.sendMeowChannelSubmit.on("click",async()=>{
		let channelName = myScreen.sendMeowChannelSubmit.name
		let networkName = myScreen.channelFeedTable.name
		let msgToSend = myScreen.sendMeowChannelText.content.toString()
		if(msgToSend && msgToSend !==""){
			try{
				await myMeow.sendMeow(msgToSend+" "+channelName,false,networkName)
				let channelFeed = await myMeow.getChannelFeed(channelName,100,networkName)
                	        myScreen.showChannelFeed(channelFeed,channelName,networkName)
                	        handleSendInChannel()
			}catch(e){}
		}
	});
	myScreen.sendMeowChannelUnfollow.on("click",async()=>{
		let channelName = myScreen.sendMeowChannelSubmit.name
		let networkName = myScreen.channelFeedTable.name
		try{
			await myMeow.unFollowChannel(channelName,networkName)
			let availableNetworks = await myMeow.getMyNetworks()
        	        myScreen.showMyNetworks(availableNetworks)
                	handleNetworkClick()
                	handleCreateNetwork()
		}catch(e){}
	});
}
async function handleFetchChannelFeed(){
	myScreen.followedChannelsTable.on("element click",async(element,mouse) =>{
		let networkName = myScreen.followedChannelsTable.name
		let channelName = element.content.toString().replace(/ /g,'')
		if(channelName && channelName !==""){
			channelName = channelName.substring(channelName.lastIndexOf("#"))
			try{
				let channelFeed = await myMeow.getChannelFeed(channelName,100,networkName)
				myScreen.showChannelFeed(channelFeed,channelName,networkName)
				handleSendInChannel()
			}catch(e){}
		}
	});
}
async function handleFollowChannelSubmit(){
	myScreen.followChannelSubmit.on("click", async function(){
		let networkName = myScreen.followChannelSubmit.name
		let channelName = myScreen.followChannelValue.value.toString()
		if(channelName && channelName !==""){
			try{
				await myMeow.addChannelInNetwork(networkName,channelName)
				await myMeow.followChannel(channelName,networkName)
				let networkChannels = await myMeow.getNetworkMetadata(networkName);
				myScreen.showChannels(networkChannels["channels"],networkName)
				myScreen.dynamicBox.focus()
				handleFollowChannelSubmit()
				handleFetchChannelFeed()
			}catch(e){}
		}
	});
	myScreen.leaveNetworkSubmit.on("click",async function(){
		let networkName = myScreen.leaveNetworkSubmit.name
		if(networkName && networkName !==""){
			try{
				await myMeow.leaveNetwork(networkName)
			}catch(e){}
		}
	});
}
async function handleEthAddressClick(){
	myScreen.verifiedEthAddressesTable.on("element click",async(element,mouse)=>{
		let selectedAddress = element.content.toString().replace(/ /g,'');
		if(web3.utils.isAddress(selectedAddress)){
			try{
				let ownedDomains = await getZnaFromSubgraph(selectedAddress)
				if(ownedDomains)
					myScreen.showOwnedDomains(ownedDomains)
				else
					console.log(chalk.red("Not owning any znas"))
			}catch(e){}
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
	try{
	    var ownedDomains = await graphClient.request(graphQuery)
	    if (ownedDomains.account && ownedDomains.account.ownedDomains)
        	return ownedDomains.account.ownedDomains
	}catch(e){}
}
async function handleEthVerify(){
	myScreen.verifyEthButton.on('click', async function(){
		let ethAddress = myScreen.ethAddressTextBox.value.toString()
		let ethSig = myScreen.ethSigTextBox.value.toString()
		if(ethAddress && web3.utils.isAddress(ethAddress)){
			if(ethSig){
				try{
					let duplicated = false;
					let ethData = await myMeow.zchain.zStore.getPeerEthAddressAndSignature(myPeerId)
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
	try{
		let followedPeersCount = Object.entries(myMeow.store.meowDbs.followingZIds.all).length
        	let followedChannelsCount = Object.keys(await myMeow.getFollowedChannels()).length
		let onGoingMeow =""
		if(myScreen.sendMeowText)
			onGoingMeow = myScreen.sendMeowText.content
		let twitterChecked = false;
		if(myScreen.sendMeowTwitter && myScreen.sendMeowTwitter.checked)
			twitterChecked = true;
        	myScreen.showInfos(myPeerId,nodeEthDefaultAddress,followedPeersCount,followedChannelsCount,connectedPeers.length)
		if(twitterChecked){
                	myScreen.sendMeowTwitter.checked = true;
        	}
		if(onGoingMeow != ""){
			myScreen.sendMeowText.setValue(onGoingMeow)
			myScreen.sendMeowText.focus()
		}
		nodeEthDefaultAddress = await myMeow.zchain.zStore.getPeerEthAddressAndSignature(myPeerId)
		let ethEnabled=false;
		let ethAddress="";
		if(nodeEthDefaultAddress && nodeEthDefaultAddress["defaultAddress"]){
			ethEnabled = true;
			ethAddress = nodeEthDefaultAddress["defaultAddress"]
		}
		let isTwitterEnabled = myMeow.getTwitterConfig()
		let twitterEnabled =false;
		if(isTwitterEnabled)
			twitterEnabled=true;
		myScreen.updateConfigBox(twitterEnabled,ethEnabled)
		if(ethAddress !=="")
			myScreen.nodeEthAddress.content = ethAddress;
		myScreen.screen.render()
		myScreen.sendMeowSubmit.on('click',async function(){
			let meowText = myScreen.sendMeowText.content.toString()
			if(meowText !== undefined && meowText !== ""){
				let twitterCheck = myScreen.sendMeowTwitter.checked;
				await myMeow.sendMeow(meowText,twitterCheck);
				myScreen.sendMeowText.setContent("")
				infosInterval()
			}
		});
	}catch(e){}
}
async function handleAddressBookClick(){
	myScreen.followedPeersTable.on("element click",async(element,mouse)=>{
		let regex = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/;
		if(element.content.match(regex)){
			let selectedPeerId = element.content.match(regex)
			let selectedPeerName =""
			try{
				let followedPeers = await myMeow.getFollowedPeers()
        	                followedPeers.forEach(peer=>{
                	                if(peer["peerId"] == selectedPeerId){
                        	                 if(peer["displayName"] !== undefined) selectedPeerName = peer["displayName"]
                                	}
                        	});
				let peerFeed = await myMeow.getPeerFeed(selectedPeerId,50)
                        	myScreen.showPeer(selectedPeerId,selectedPeerName,peerFeed)
                        	handleNameChange()
			}catch(e){}
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
			try{
	                        connectedPeers.forEach(peer=>{
        		                if(peer["peerId"] == selectedPeerId){
                		                 if(peer["peerName"] !== undefined) selectedPeerName = peer["peerName"]
                        	        }
                        	})
				let peerFeed = await myMeow.getPeerFeed(selectedPeerId,50)
                        	myScreen.showPeer(selectedPeerId,selectedPeerName,peerFeed)
                        	handleNameChange()
			}catch(e){}
        	}
        });

}
async function handleNameChange(){
	myScreen.peerNameSubmit.on("click",async function(){
		let targetPeerId = myScreen.peerId.content.toString()
		let targetPeerName = myScreen.peerName.content.toString()
		if(targetPeerName !==""){
			try{
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
			}catch(e){}
		}
	});
	myScreen.peerUnfollowButton.on("click",async function(){
		try{
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
		}catch(e){}
	});
	myScreen.peerEthAddressesButton.on("click",async function(){
		try{
			let targetPeerId = myScreen.peerId.content.toString();
			let followed = false;
			let followedPeers = await myMeow.getFollowedPeers()
                	followedPeers.forEach(peer=>{
                		if(peer["peerId"] == targetPeerId)
					followed= true;
                	});
			if(followed){
				let addressesValid = true;
				let ethAddresses = await myMeow.zchain.zStore.getPeerEthAddressAndSignature(targetPeerId)
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
		}catch(e){}
	});
}
async function handleConnections(){
	myMeow.zchain.peerDiscovery.onConnect(async(connection) => {
		try{
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
		}catch(e){}
	});
	myMeow.zchain.peerDiscovery.node.connectionManager.on("peer:disconnect",async(connection) =>{
		try{
			let connectionPeerId = connection.remotePeer.toB58String()
			connectedPeers = connectedPeers.filter((item) => item["peerId"] !== connectionPeerId);
			console.log("Disconnected from : "+connectionPeerId);
		}catch(e){}
	});
}
async function routeOutput(){
	let isObject = function(a) {
    	return (!!a) && (a.constructor === Object);
	};
	 for (let func in console) {
                //if (func == "error") continue;
                if (func == "log"  || func == "error"){
                        console[func] = function(text,extra) {
                                if(extra === undefined) extra="";
                                if(text.length > 0){
					if(isObject(extra))
						extra ="";
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
