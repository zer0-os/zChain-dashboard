if [ -d "~/.config/yarn/link/" ]
then
	sudo rm -r ~/.config/yarn/link/zchain-core
	sudo rm -r ~/.config/yarn/link/meow-app
fi
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
npm install
if [ -d "./zChain" ]
then
	sudo rm -r ./zChain
fi
git clone https://github.com/zer0-os/zChain
cd zChain && sh install.sh
cd .. && yarn link meow-app zchain-core
