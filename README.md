# CallGroupDisplay  

js-app for digium phones to display current calls in particaluar callgroup

## App Installation:

Activate Developer mode on your Digium phone (Menu -> Admin Setting -> System Tools -> Enable App Development)  
Download .zip-archive and upload it to your Digium phone (http://phone-ip/app_dev)  
Configure app's settings in phone's web interface:  
callgroup: 1 (here must be real callgroup as your asterisk settings)    
pickupgroup: 1 (here must be real group as your asterisk settings)  
server: http://servcer-ip:server-port (ex. http://192.168.1.254:8000)  
prefix: asterisk pickup feature code (ex. *8)  
language: ru (nowadays only 'ru' and 'en' are available)  

## Server Installation:

Download server.py from this repo and run it on your Asterisk server (write your port and host in server.py)  

## Asterisk settings:  

##### Insert in your dialplan these settings:  

;;this must be in incoming dialplan  
same => n,Set(CallGroup=${SIPPEER(${EXTEN},callgroup)})  
same => n,NoOp(Callgroup = ${CallGroup})  
same => n,Set(PickupGroup=${SIPPEER(${EXTEN},pickupgroup)})  
same => n,NoOp(PickupGroup = ${PickupGroup})  
same => n,System(curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X POST -d '{"uid":"${UNIQUEID}", "callgroup":"${CallGroup}", "pickupgroup":"${PickupGroup}", "from":"${CALLERID(num)}", "to":"${EXTEN}"}' http://192.168.1.254:8000/put)  

;;h-extension  
exten => h,1,NoOp(END of App)  
same => n,System(curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X POST -d '{"uid":"${UNIQUEID}", "callgroup":"${CallGroup}", "pickupgroup":"${PickupGroup}", "from":"${CALLERID(num)}", "to":"${TARGETNO}"}' http://192.168.1.254:8000/del)  
same => n,Hangup()  

##### Video demonstration:  
https://www.youtube.com/watch?v=urHjgg0-cyY&feature=youtu.be


