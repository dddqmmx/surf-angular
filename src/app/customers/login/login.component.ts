import { Component } from '@angular/core';
import {NgIf} from "@angular/common";
import {encryptData} from "../../util/encryption/encryption_ras";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  socket: WebSocket | undefined;
  fileDropped: boolean = false;
  fileContent: any;
  serverPublicKey: string | undefined;
  init:boolean = false;
  onFileDrop(event: any) {
    event.preventDefault();
    this.fileDropped = true;
    this.readFile(event.dataTransfer.files[0]);
  }

  onDragOver(event: any) {
    event.preventDefault();
  }

  onDragLeave(event: any) {
    event.preventDefault();
    this.fileDropped = false;
  }

  onFileSelect(event: any) {
    this.fileDropped = true;
    this.readFile(event.target.files[0]);
  }

  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.fileContent = reader.result;
    };
    reader.readAsText(file);
  }

  login() {
    const self = this;
    if (this.isJSON(this.fileContent)) {
      const userFile = JSON.parse(this.fileContent)
      const serverAddress = userFile.server_address;
      const publicKey = userFile.public_key;
      this.socket = new WebSocket('ws://'+serverAddress+'/ws/login/');
      this.socket.onclose = function (e) {
        console.error('Chat socket closed unexpectedly');
      };
      this.socket.onmessage = function (e: { data: any; }) {
        const json = JSON.parse(e.data)
        const command =  json.command;
        if (command == "init") {
          self.serverPublicKey = json.public_key;
            const requestJson = {
              'command': 'login',
              'public_key': publicKey
            }
            self.send(JSON.stringify(requestJson));
        }
      };
    } else {
      console.log('不是 JSON 文件');
      // 显示错误信息或采取其他操作
    }
  }

  send(massage: string){
    if (this.serverPublicKey != null) {
      if (this.socket != null) {
        const encryptedData = encryptData((massage), this.serverPublicKey);
        if (typeof encryptedData === "string") {
          this.socket.send(encryptedData);
        }
        // if (typeof encryptedData === "string") {
        //   this.socket.send(encryptedData);
        // } else {
        //   console.error("Encryption failed.");
        // }
      }
    }
  }

  isJSON(str: any) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}
