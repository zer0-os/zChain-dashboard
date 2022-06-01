import blessed from 'blessed';
import contrib from 'blessed-contrib';
import fs from "fs";
import bigInt from "big-integer";
import pkg from 'p-iteration';
const {forEach} = pkg;

export class ZScreen {

	constructor() {
        	this.screen = blessed.screen({
        		smartCSR: true,
        		autoPadding: true,
			cursor : {shape : 'underline'}
        	});
        	this.screen.title = "Zchain dashboard"
        	this.screen.key(['escape', 'C-c'], function(ch, key) {
			this.screen.destroy()
			return process.exit(0);
        	});
		this.meowAsci = fs.readFileSync("meowAsci.txt")
		this.container = blessed.box({
			parent : this.screen,
			top: '2%',
			left: '2%',
			width: '96%',
			height: '96%',
			tags: true,
			border: {type: 'line'},
			style: {
				fg: 'green',
				border: {fg: '#f0f0f0'},
			}
		});
		this.initScreen()
	}
	showChannelFeed(channelFeed,channelName){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel("Channel "+channelName)
		this.formattedChannelFeed=[[]]
		if(channelFeed){
			for(const msg of channelFeed){
				let msgFrom = msg.from
				let msgContent = msg.message
				this.formattedChannelFeed.push([msgFrom+" : "+msgContent.replace(channelName,"")])
			}
		}
		this.channelFeedTable = blessed.listtable({
			parent: this.dynamicBox,
                        left:'center',
                        top:'1%',
                        mouse:true,
                        width:'98%',
                        height:'75%',
                        data: this.formattedChannelFeed,
                        border:'line',
                        align:'left',
                        tags:true,
                        style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		})
		this.sendMeowChannelLabel = blessed.text({
                        parent : this.dynamicBox,
                        left: '1%',
                        top :'80%',
                        fg :'blue',
                        align:'center',
                        tags :'true',
                        content : '{bold}{underline}Compose you meow{/}'
                });
                this.sendMeowChannelText = blessed.textbox({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        align:'left',
                        style: {bg: 'white',fg:'black'},
                        height: 2,
                        width: "55%",
                        left: '22%',
                        top: '77%',
                        inputOnFocus: true
                });
                this.sendMeowChannelSubmit = blessed.button({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        padding: {left: 1,right: 1},
                        left: '80%',
                        top: '80%',
                        shrink: true,
                        width: '18%',
                        align: 'left',
                        tags:'true',
			name : channelName,
                        content: '    {bold}Send message{/bold}',
                        style: {bg: 'blue',focus: {bg: 'red'}}
                });

		this.screen.render()
	}
	showChannels(followedChannels){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel("Followed channels")
		this.followedChannels =[["Channel name"]]
		if(followedChannels){
			followedChannels.forEach(channel=>{
				this.followedChannels.push([channel]);
			});
		}
		this.followedChannelsTable = blessed.listtable({
			parent: this.dynamicBox,
			left:'center',
			top:'1%',
			mouse:true,
			width:'98%',
			height:'75%',
			data: this.followedChannels,
			border:'line',
			align:'center',
			tags:true,
			style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		});
		this.followChannelLabel = blessed.text({
			parent:this.dynamicBox,
			left:'1%',
			top :'80%',
			tags :true,
			content : '{bold}Channel name : {/bold}'
		});
		this.followChannelValue = blessed.textbox({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        align:'center',
                        style: {bg: 'blue'},
                        height: 1,
                        width: 30,
                        left: '20%',
                        top: '80%',
                        value: null,
                        inputOnFocus: true
                });
                this.followChannelSubmit = blessed.button({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        padding: {left: 1,right: 1},
                        left: '70%',
                        top: '80%',
                        shrink: true,
                        width: '17%',
                        align: 'center',
                        tags:'true',
                        content: '{bold}Follow channel{/bold}',
                        style: {bg: 'blue',align:'center',focus: {bg: 'red'}}
                });
		this.screen.render()
	}
	showOwnedDomains(ownedDomains){
		this.emptyDynamicBox();
		this.dynamicBox.setLabel("Owned Znas");
		this.ownedDomains =[["Domain industry","Domain identifier"]]
		ownedDomains.forEach(zna => {
            		var lastIndexOfPoint = zna.name.lastIndexOf(".")
            		this.ownedDomains.push([zna.name.substring(zna.name.indexOf(".") + 1, lastIndexOfPoint).replaceAll("."," "), zna.name.substring(lastIndexOfPoint + 1)])
        	});
		this.ownedDomainsTable = blessed.listtable({
                        parent : this.dynamicBox,
                        left : 'center',
                        top : '1%',
                        mouse:'true',
                        width :'98%',
                        height :'90%',
                        data: this.ownedDomains,
                        border: 'line',
                        align: 'left',
                        tags: true,
                        style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
                });
                this.screen.render()
	}
	showVerifiedAddresses(ethAddresses){
		this.emptyDynamicBox();
		this.dynamicBox.setLabel("Verified ethereum addresses");
		this.verifiedEthAddresses = [["Ethereum address"]]
		if(ethAddresses && ethAddresses["meta"]){
			ethAddresses["meta"].forEach(address=>{
				this.verifiedEthAddresses.push([address["ethAddress"]])
			});
		}
		this.verifiedEthAddressesTable = blessed.listtable({
                        parent : this.dynamicBox,
                        left : 'center',
                        top : '1%',
                        mouse:'true',
                        width :'98%',
                        height :'90%',
                        data: this.verifiedEthAddresses,
                        border: 'line',
                        align: 'center',
                        tags: true,
                        style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
                });
                this.screen.render()

	}
	showEthereum(peerId){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel("Ethereum functions");
		this.ethAddressLabel = blessed.text({
			parent : this.dynamicBox,
                        left:'1%',
                        top :'10%',
                        fg:'white',
                        align:'center',
                        tags:'true',
                        content :'{bold}{underline}Ethereum Address :{/}'
		});
		this.ethAddressTextBox = blessed.textbox({
			parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        align:'left',
                        style: {bg: 'white',fg:'black'},
                        height: 1,
                        width: "40%",
                        left: '25%',
                        top: '10%',
                        inputOnFocus: true,
			cursor :{artificial : true,color:'green'}
		});
		this.ethAddressPasteWarning = blessed.text({
			parent:this.dynamicBox,
			fg:'red',
			left:'70%',
			top:'10%',
			tags:'true',
			content:'Press {bold}esc{/bold} after pasting'
		});
		this.ethSigLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'20%',
                        fg:'white',
                        align:'center',
                        tags:'true',
                        content :'{bold}{underline}Ethereum signature :{/}'
                });
                this.ethSigTextBox = blessed.textbox({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        align:'left',
                        style: {bg: 'white',fg:'black'},
                        height: 1,
                        width: "60%",
                        left: '25%',
                        top: '20%',
                        inputOnFocus: true
                });
		this.verifyEthButton = blessed.button({
			parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        padding: {left: 1,right: 1},
                        left: '60%',
                        top: '30%',
                        shrink: true,
                        width: '20%',
                        align: 'center',
                        tags:'true',
                        content: '{bold}Verify signature{/bold}',
                        style: {bg: 'blue',align:'center',focus: {bg: 'white'}}
		});
		this.ethGuide = blessed.text({
			parent :this.dynamicBox,
			align:'left',
			top :'50%',
			left :'2%',
			tags:'true',
			fg:'white',
			content :'⚠  To verify ownership of ethereum address :\n * copy your {bold}Peer Id :{/bold} '+peerId+'\n * go to {underline}{bold}https://etherscan.io/verifiedSignatures{/}\n * click on {bold}Sign message{/bold}\n * Connect your wallet and paste your {bold}Peer Id{/bold} in message to sign\n * After signing copy {bold}Signature hash{/bold} and paste it here'
		});

	}
	showAddressBook(followedPeers,connectedPeers){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel('Followed peers')
		let followedPeersData = [["Peer Id","Peer Name","Status"]]
		followedPeers.forEach(peer =>{
			let status = "Offline"
			connectedPeers.forEach(cpeer =>{
				if(cpeer["peerId"] == peer["peerId"])
					status = "Online"
			});
			followedPeersData.push([peer["peerId"],peer["displayName"],status]);
		});
		this.followedPeersTable = blessed.listtable({
			parent : this.dynamicBox,
                        left : 'center',
                        top : '1%',
                        mouse:'true',
                        width :'98%',
                        height :'90%',
                        data: followedPeersData,
                        border: 'line',
                        align: 'center',
                        tags: true,
                        style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		});
		this.screen.render()
	}
	showInfos(myPeerId,myEthAddress,followedPeersCount,followedChannelsCount,connectedPeersCount){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel('Node Informations')
		this.nodeIdLabel = blessed.text({
			parent : this.dynamicBox,
			left:'1%',
			top :'10%',
			fg:'white',
			align:'center',
			tags:'true',
			content :'{bold}{underline}PEER ID :{/}'
		});
		this.nodeId = blessed.text({
			parent : this.dynamicBox,
			left:'25%',
			top :'10%',
			fg:'green',
			align:'right',
			content: myPeerId.toString()
		})
		this.nodeEthAddressLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'20%',
                        fg:'white',
                        align:'center',
			tags:'true',
                        content :'{bold}{underline}PEER ETH ADDRESS :{/}'
                });
                this.nodeEthAddress = blessed.text({
                        parent : this.dynamicBox,
                        left:'25%',
                        top :'20%',
                        fg:'green',
                        align:'right',
                        content: (myEthAddress !== "" ) ? myEthAddress.toString(): "Verify your address in settings"
                })
		this.nodeFollowedPeersCountLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'30%',
                        fg:'white',
                        align:'center',
			tags:'true',
                        content :'{bold}{underline}FOLLOWED PEERS :{/}'
                });
                this.nodeFollowedPeersCount = blessed.text({
                        parent : this.dynamicBox,
                        left:'25%',
                        top :'30%',
                        fg:'green',
                        align:'center',
                        content: followedPeersCount.toString()
                })
		this.nodeFollowedChannelsCountLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'40%',
                        fg:'white',
                        align:'center',
			tags:'true',
                        content :'{bold}{underline}FOLLOWED CHANNELS :{/}'
                });
                this.nodeFollowedChannelsCount = blessed.text({
                        parent : this.dynamicBox,
                        left:'25%',
                        top :'40%',
                        fg:'green',
                        align:'center',
                        content: followedChannelsCount.toString()
                })
		this.nodeConnectedPeersCountLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'50%',
                        fg:'white',
                        align:'center',
			tags:'true',
                        content :'{bold}{underline}CONNECTED PEERS :{/}'
                });
                this.nodeConnectedPeersCount = blessed.text({
                        parent : this.dynamicBox,
                        left:'25%',
                        top :'50%',
                        fg:'green',
                        align:'center',
                        content: connectedPeersCount.toString()
                })
		this.sendMeowLabel = blessed.text({
			parent : this.dynamicBox,
			left: '1%',
			top :'75%',
			fg :'blue',
			align:'center',
			tags :'true',
			content : '{bold}{underline}Compose you meow{/}'
		});
		this.sendMeowText = blessed.textbox({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        align:'left',
                        style: {bg: 'white',fg:'black'},
                        height: 3,
                        width: "50%",
                        left: '25%',
                        top: '65%',
                        name: 'sendMeowInput',
                        inputOnFocus: true
                });
                this.sendMeowSubmit = blessed.button({
                        parent: this.dynamicBox,
                        mouse: true,
                        keys: true,
                        padding: {left: 1,right: 1},
                        left: '80%',
                        top: '75%',
                        shrink: true,
                        width: '18%',
                        align: 'center',
                        name: 'submit',
			tags:'true',
                        content: '    {bold}Send meow{/bold}',
                        style: {bg: 'blue',align:'center',focus: {bg: 'red'}}
                });
		this.screen.render()
	}
	showPeer(peerId,peerName,peerFeed){
		this.emptyDynamicBox()
		this.dynamicBox.setLabel("Peer details");
		this.peerDetailsTitle = blessed.text({
			parent: this.dynamicBox,
			top :'1%',
			left:'center',
			align :'center',
			fg :'white',
			tags:'true',
			content :'{bold}Peer details and feed{bold}'
		});
		this.peerUnfollowButton = blessed.button({
			parent :this.dynamicBox,
			top:'1%',
			left:'75%',
			align:'center',
			bg :'red',
			tags:'true',
			content : '{bold}Unfollow{/bold}',
			padding: {left: 1,right: 1},
			mouse:'true',
			keys:'true',
			shrink:'true',
			height:'10%'
		});
		this.peerEthAddressesButton = blessed.button({
			parent:this.dynamicBox,
			top:'1%',
			left:'85%',
			align:'center',
			bg:'blue',
			tags:'true',
			content:'{bold}Eth Address{/bold}',
			mouse:true,
			shrink:true,
			height:'10%'
		});
		this.peerIdLabel = blessed.text({
                        parent : this.dynamicBox,
                        left:'1%',
                        top :'20%',
                        fg:'white',
                        align:'center',
			tags:'true',
                        content :'{bold}{underline}PEER ID :{/}'
                });
                this.peerId = blessed.text({
                        parent : this.dynamicBox,
                        left:'25%',
                        top :'20%',
                        fg:'green',
                        align:'center',
                        content: peerId.toString()
                })
		this.peerNameLabel =blessed.text({
			parent: this.dynamicBox,
			left:'1%',
			top :'30%',
			fg:'white',
			align:'center',
			tags:'true',
			content:'{bold}{underline}Friendly name :{/}'
		});
		this.peerNameForm = blessed.form({
			parent: this.dynamicBox,
			mouse: true,
			keys: true,
			vi: true,
			left: '20%',
			top: '30%',
			width: '70%',
			height :'15%',
			style: {fg: 'green',scrollbar: {inverse: true}},
			content: '',
			scrollable: true,
			scrollbar: {ch: ' '}
		})
		this.peerName = blessed.textbox({
			parent: this.peerNameForm,
			mouse: true,
			keys: true,
			align:'center',
			style: {bg: 'blue'},
			height: 1,
			width: 30,
			left: '20%',
			top: '30%',
			name: 'peerNameInput',
			value: peerName,
			inputOnFocus: true
		});
		this.peerNameSubmit = blessed.button({
			parent: this.peerNameForm,
			mouse: true,
			keys: true,
			padding: {left: 1,right: 1},
			left: '70%',
			top: '30%',
			shrink: true,
			width: (peerName !== "") ? 30 : 50,
			align: 'center',
			name: 'submit',
			tags:'true',
			content: (peerName !== "") ? '     {bold}Change name{/bold}' : ' {bold}Follow and set name{/bold}',
			style: {bg: 'blue',align:'center',focus: {bg: 'red'}}
		});
		this.peerFeedLog = blessed.log({
			parent: this.dynamicBox,
			top : '45%',
			left :'1%',
			width:'98%',
			height :'50%',
			label : 'Peer feed',
			align :'left',
			fg:'green',
                        tags: true,
                        keys: true,
                        vi: true,
                        mouse: true,
                        border :{ type:'bg',ch:'¤'},
                        scrollback: 100,
                        scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		})
		peerFeed.forEach(feed =>{
			this.peerFeedLog.log("Message published in channels ("+feed["channel"].toString()+") : "+feed["message"])
		});
		this.screen.render()
	}
	showConnected(connectedPeers){
		this.emptyDynamicBox();
		let formattedData = [["PEER ID","PEER NAME"]]
		connectedPeers.forEach(peer=>{
			if(peer["peerName"] === undefined || peer["peerName"] =="")
				formattedData.push([peer["peerId"],"Click to set name"])
			else
				formattedData.push([peer["peerId"],peer["peerName"]])
		});
		this.connectedTable = blessed.listtable({
			parent : this.dynamicBox,
			label:'Connected peers',
			left : 'center',
			top : '5%',
			mouse:'true',
			width :'98%',
			height :'90%',
			data: formattedData,
			border: 'line',
			align: 'center',
			tags: true,
			style: {border: {fg: 'blue'},header: {fg: 'green',bold: true},cell: {fg: 'magenta',selected:{bg:'blue'},align:'center'}},
			scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		});
		this.screen.render()
	}
	emptyDynamicBox(){
		this.dynamicBox.destroy()
		this.dynamicBox = blessed.box({
                        align: 'center',
                        mouse: 'true',
                        border :'line',
                        style :{
                                fg:'green',
                                selected : {bg:'blue'}
                        },
                        width :'64%',
                        height :'39%',
                        top :'21%',
                        left:'33%',
                        tags :'true',
                        invertSelected :false,
                });
		this.screen.append(this.dynamicBox)
		this.dynamicBox.focus()
		this.screen.render()
	}
	initScreen(){
		this.titleText = blessed.log({
			parent:this.container,
			align:'left',
			top: '1%',
			left: '1%',
			width : '28%',
			fg:'green',
			height : '20%',
			scrollback : '100',
			border :{ type:'bg',ch:'¤','fg':'blue'},
			content : ''
		});
		this.titleText2 = blessed.log({
                        parent:this.container,
                        align:'left',
                        top: '1%',
                        left: '69%',
                        width : '28%',
                        fg:'green',
                        height : '20%',
                        scrollback : '100',
                        border :{ type:'bg',ch:'¤','fg':'blue'},
                        content : ''
                });

		this.configBox = blessed.text({
			parent: this.container,
			align:'center',
			top:'1%',
			left:'30%',
			width:'38%',
			padding: {left: 1,right: 1},
			fg:'green',
			tags:'true',
			height:'18%',
			border :{type :'bg',ch:'¤','fg':'blue'},
			content : '  {white-fg}{bold}Auto update:  {/}   10 sec \n  {white-fg}{bold}Zchain status:  {/} Connected\n  {white-fg}{bold}Twitter:  {/}       Disabled\n  {white-fg}{bold}Ethereum:  {/}     Not verified'
		});
		this.dynamicBox = blessed.box({
			align: 'center',
			mouse: 'true',
			border :'line',
			style :{
				fg:'green',
				selected : {bg:'blue'}
			},
			width :'64%',
			height :'39%',
			top :'21%',
			left:'33%',
			tags :'true',
			invertSelected :false,
		});
		this.screen.append(this.dynamicBox)
		this.menuBox = blessed.list({
			align: 'left',
			mouse: true,
			label: 'MENU',
			border: 'line',
			style: {
				fg: 'green',
				bg: 'white',
				border: {fg: 'default',bg: 'default'},
				selected: {bg: 'blue'}
			},
			width: '30%',
			height: '39%',
			top: '21%',
			left: '3%',
			tags: true,
			invertSelected: false,
			items: ["♟  MY NODE DETAILS","▶  CONNECTED PEERS","✉  CHANNELS","❤  ADDRESS BOOK","⚙  ETHEREUM ADDRESS","♦  VERIFIED ADDRESSES"],
			scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		});
		this.screen.append(this.menuBox)
		this.generalLogBox = blessed.log({
			top : '60%',
			label:'  NODE LOGS  ',
			align:'center',
			padding :'1%',
			left :'51%',
			width:'48%',
			height:'39%',
			fg:'green',
			tags: true,
			keys: true,
			vi: true,
			mouse: true,
			border :{ type:'bg',ch:'¤'},
			scrollback: 100,
			scrollbar: {ch: ' ',track: {bg: 'blue'},style: {inverse: true}}
		});
		this.screen.append(this.generalLogBox)
		this.mapBox = contrib.map({
			label :"  CONNECTIONS  ",
			top : '60%',
			left :'1%',
			width :'49%',
			height: '39%',
			border :{ type:'bg',ch:'¤'},
		});
		this.screen.append(this.mapBox)
	}
}
