import {readFile,rm} from 'node:fs/promises'
import path from 'node:path'
/** Clean only a named package's generated dist before declaration compilation. */
export async function cleanDistribution(directory){const metadata=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));if(!metadata.name?.startsWith('@usecloud/'))throw new Error('Not a useCloud package');await rm(path.join(directory,'dist'),{recursive:true,force:true})}
