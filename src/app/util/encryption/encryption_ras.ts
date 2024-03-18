import forge from "node-forge";
import {main} from "@angular/compiler-cli/src/main";


export function encryptData(data: string, publicKey: string): string | false {
  try {
    const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    const blockSize = 400; // 设置块大小
    const dataChunks = data.match(new RegExp(`.{1,${blockSize}}`, 'g')); // 将数据拆分为块
    let encryptedChunks: string[] = [];

    if (dataChunks) {
      for (const chunk of dataChunks) {
        const buffer = forge.util.encodeUtf8(chunk);
        const encrypted = publicKeyObj.encrypt(buffer, 'RSA-OAEP', {
          md: forge.md.sha256.create(),
          mgf1: {
            md: forge.md.sha256.create()
          }
        });
        encryptedChunks.push(forge.util.encode64(encrypted));
      }
      return encryptedChunks.join(' '); // 将加密后的块连接成一个字符串
    } else {
      throw new Error('Data splitting failed.');
    }
  } catch (err) {
    console.error('Encryption failed:', err);
    return false;
  }
}

export function decryptData(encryptedData: string, privateKey: string): string | false {
  try {
    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
    const encryptedChunks = encryptedData.split(' '); // Split encrypted data into chunks
    let decryptedChunks: string[] = [];

    for (const chunk of encryptedChunks) {
      const encryptedBytes = forge.util.decode64(chunk);
      const decrypted = privateKeyObj.decrypt(encryptedBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create()
        }
      });
      decryptedChunks.push(forge.util.decodeUtf8(decrypted));
    }

    return decryptedChunks.join(''); // Join decrypted chunks into a single string
  } catch (err) {
    console.error('Decryption failed:', err);
    return false;
  }
}
