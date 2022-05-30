import {MEOW} from "meow-app";
import pkg from 'zchain-core';
const {decode,ZChainMessage} = pkg;

export class Meow extends MEOW {

	constructor(identity){
		return (async () => {
			await super()
			await super.init(identity)
			return this
		})();
	}
}
