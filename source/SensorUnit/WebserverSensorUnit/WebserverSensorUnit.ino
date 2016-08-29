#include <ESP8266WiFi.h>
#include <SFE_BMP180.h>
#include <Wire.h>

// HDC1000 I2C address is 0x40(64)

#define Addr 0x40
#define ALTITUDE 1260.0 //Höhe in Leysin
#define AMPLITUDEPIN A0
unsigned long previousMillis = 0;        // will store last time LED was updated
const long interval = 1000;           // interval at which to Update the Sensor Variables (milliseconds)

const char* ssid = "SAC";
const char* password = "copacabana";


unsigned long ulReqcount;
unsigned long ulReconncount;
double T,P,p0,a;
float cTemp;
float fTemp;
float humidity;
int amplitudeMean;
int amplitude[100];
int ampIndex=0;

double realtemp;


// Create an instance of the server on Port 80
WiFiServer server(80);

SFE_BMP180 pressure; 


void WiFiStart()
{
  ulReconncount++;
  
  // Connect to WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  
  // Start the server
  server.begin();
  Serial.println("Server started");

  // Print the IP address
  Serial.println(WiFi.localIP());
}

void setup(){  

// Initialise I2C communication as MASTER  

Wire.begin(D2, D3);  

// Initialise serial communication, set baud rate = 9600  

Serial.begin(115200);

if (pressure.begin()) Serial.println("BMP180 init success");
else {
    // Oops, something went wrong, this is usually a connection problem,
    // see the comments at the top of this sketch for the proper connections.

    Serial.println("BMP180 init fail\n\n");
    while(1); // Pause forever.
}
  Serial.print("provided altitude: ");
  Serial.print(ALTITUDE,0);
  Serial.print(" meters. ");

// Starts I2C communication  
Wire.beginTransmission(Addr);  
// Select configuration register  
Wire.write(0x02);  
// Temperature, humidity enabled, resolultion = 14-bits, heater on  
Wire.write(0x30);  
// Stop I2C Transmission  
Wire.endTransmission();  
delay(300);

// setup globals
  ulReqcount=0; 
  ulReconncount=0;
  
  pinMode(2, OUTPUT);
  digitalWrite(2, 0);
  
  // inital connect
  WiFi.mode(WIFI_STA);
  WiFiStart();
}

void loop(){
  unsigned long currentMillis = millis();
  
  if (currentMillis - previousMillis >= interval) {
    // save the last time you blinked the LED
    previousMillis = currentMillis;

unsigned int data[2];
// Starts I2C communication  
Wire.beginTransmission(Addr);  
// Send temp measurement command  
Wire.write(0x00);  
// Stop I2C Transmission  
Wire.endTransmission();  
delay(50);
// Request 2 bytes of data  
Wire.requestFrom(Addr, 2);
// Read 2 bytes of data
// temp msb, temp lsb  
if (Wire.available() == 2) {    
data[0] = Wire.read();    
data[1] = Wire.read();  
}  

// Convert the data  
int temp = (data[0] * 256) + data[1];  
cTemp = (temp / 65536.0) * 165.0 - 40;  
fTemp = cTemp * 1.8 + 32;
// Starts I2C communication  
Wire.beginTransmission(Addr);  
// Send humidity measurement command  
Wire.write(0x01);  
// Stop I2C Transmission  
Wire.endTransmission();  
delay(50);
// Request 2 bytes of data  
Wire.requestFrom(Addr, 2);
// Read 2 bytes of data  
// humidity msb, humidity lsb  
if (Wire.available() == 2)  {    
data[0] = Wire.read();    
data[1] = Wire.read();  
}
// Convert the data  
humidity = (data[0] * 256) + data[1];  
humidity = (humidity / 65536.0) * 100.0;
// Output data to serial monitor  
Serial.println(" ");
Serial.print("Relative Humidity :");  
Serial.print(humidity);  
Serial.println(" %RH");  
Serial.print("Temperature in Celsius :");  
Serial.print(cTemp);  
Serial.println(" C");  
Serial.print("Temperature in Fahrenheit :");  
Serial.print(fTemp);  
Serial.println(" F");

char status;

  // You must first get a temperature measurement to perform a pressure reading.
  
  // Start a temperature measurement:
  // If request is successful, the number of ms to wait is returned.
  // If request is unsuccessful, 0 is returned.

  status = pressure.startTemperature();
  if (status != 0)
  {
    // Wait for the measurement to complete:
    delay(status);

    // Retrieve the completed temperature measurement:
    // Note that the measurement is stored in the variable T.
    // Function returns 1 if successful, 0 if failure.

    status = pressure.getTemperature(T);
    if (status != 0)
    {
      // Print out the measurement:
      Serial.print("temperature: ");
      Serial.print(T,2);
      Serial.print(" deg C, ");
      Serial.print((9.0/5.0)*T+32.0,2);
      Serial.println(" deg F");
      
      // Start a pressure measurement:
      // The parameter is the oversampling setting, from 0 to 3 (highest res, longest wait).
      // If request is successful, the number of ms to wait is returned.
      // If request is unsuccessful, 0 is returned.

      status = pressure.startPressure(3);
      if (status != 0)
      {
        // Wait for the measurement to complete:
        delay(status);
        status = pressure.getPressure(P,T);
        if (status != 0)
        {
          // Print out the measurement:
          Serial.print("absolute pressure: ");
          Serial.print(P,2);
          Serial.print(" mb, ");
          Serial.print(P*0.0295333727,2);
          Serial.println(" inHg");

          // The pressure sensor returns abolute pressure, which varies with altitude.
          // To remove the effects of altitude, use the sealevel function and your current altitude.
          // This number is commonly used in weather reports.
          // Parameters: P = absolute pressure in mb, ALTITUDE = current altitude in m.
          // Result: p0 = sea-level compensated pressure in mb

          p0 = pressure.sealevel(P,ALTITUDE); // we're at 1655 meters (Boulder, CO)
          Serial.print("relative (sea-level) pressure: ");
          Serial.print(p0,2);
          Serial.print(" mb, ");
          Serial.print(p0*0.0295333727,2);
          Serial.println(" inHg");
        }
        else Serial.println("error retrieving pressure measurement\n");
      }
      else Serial.println("error starting pressure measurement\n");
    }
    else Serial.println("error retrieving temperature measurement\n");
  }
  else Serial.println("error starting temperature measurement\n");


  amplitude[ampIndex] = analogRead(AMPLITUDEPIN);
  Serial.print("Amplitude: ");
  Serial.println(amplitude[ampIndex]);
  ampIndex++;
  
  if(ampIndex >= 30){
    int ampAcc = 0;
    for(int i=0; i<ampIndex; i++){
      ampAcc = ampAcc + amplitude[i];
    }
    amplitudeMean = ampAcc/ampIndex;
    Serial.print("Amplitudemean: ");
    Serial.println(amplitudeMean);
    ampIndex = 0;
  }
    
  } 

// check if WLAN is connected
  if (WiFi.status() != WL_CONNECTED)
  {
    WiFiStart();
  }
  
  // Check if a client has connected
  WiFiClient client = server.available();
  if (!client) 
  {
    return;
  }
  
  // Wait until the client sends some data
  Serial.println("new client");
  unsigned long ultimeout = millis()+250;
  while(!client.available() && (millis()<ultimeout) )
  {
    delay(1);
  }
  if(millis()>ultimeout) 
  { 
    Serial.println("client connection time-out!");
    return; 
  }
  
  // Read the first line of the request
  String sRequest = client.readStringUntil('\r');
  //Serial.println(sRequest);
  client.flush();
  
  // stop client, if request is empty
  if(sRequest=="")
  {
    Serial.println("empty request! - stopping client");
    client.stop();
    return;
  }
  
  // get path; end of path is either space or ?
  // Syntax is e.g. GET /?pin=MOTOR1STOP HTTP/1.1
  String sPath="",sParam="", sCmd="";
  String sGetstart="GET ";
  int iStart,iEndSpace,iEndQuest;
  iStart = sRequest.indexOf(sGetstart);
  if (iStart>=0)
  {
    iStart+=+sGetstart.length();
    iEndSpace = sRequest.indexOf(" ",iStart);
    iEndQuest = sRequest.indexOf("?",iStart);
    
    // are there parameters?
    if(iEndSpace>0)
    {
      if(iEndQuest>0)
      {
        // there are parameters
        sPath  = sRequest.substring(iStart,iEndQuest);
        sParam = sRequest.substring(iEndQuest,iEndSpace);
      }
      else
      {
        // NO parameters
        sPath  = sRequest.substring(iStart,iEndSpace);
      }
    }
  }
  
  ///////////////////////////////////////////////////////////////////////////////
  // output parameters to serial, you may connect e.g. an Arduino and react on it
  ///////////////////////////////////////////////////////////////////////////////
  if(sParam.length()>0)
  {
    int iEqu=sParam.indexOf("=");
    if(iEqu>=0)
    {
      sCmd = sParam.substring(iEqu+1,sParam.length());
      Serial.println(sCmd);
    }
  }
  
  
  ///////////////////////////
  // format the html response
  ///////////////////////////
  String sResponse,sHeader;
  
  ////////////////////////////
  // 404 for non-matching path
  ////////////////////////////
  
  ///////////////////////
  // format the html page
  ///////////////////////
  if (sPath == "/raw"){
    ulReqcount++;
    char message[2048];
    sprintf(message, "{ \"TemperatureHDC\": %s, \"TemperatureBMP\": %s, \"Humidity\": %s, \"AbsPressure\": %s, \"RelPressure\": %s, \"UsedHeight\": %s, \"Amplitude\": %s }", 
      String(cTemp).c_str(), 
      String(T).c_str(), 
      String(humidity).c_str(), 
      String(P).c_str(), 
      String(p0).c_str(), 
      String(ALTITUDE).c_str(),
      String(amplitudeMean).c_str());

    sResponse = (String)message;
    
    sHeader  = "HTTP/1.1 200 OK\r\n";
    sHeader += "Content-Length: ";
    sHeader += sResponse.length();
    sHeader += "\r\n";
    sHeader += "Content-Type: application/json\r\n";
    sHeader += "Connection: close\r\n";
    sHeader += "\r\n";
    
  }
  else if(sPath!="/")
  {
    sResponse="<html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>";
    
    sHeader  = "HTTP/1.1 404 Not found\r\n";
    sHeader += "Content-Length: ";
    sHeader += sResponse.length();
    sHeader += "\r\n";
    sHeader += "Content-Type: text/html\r\n";
    sHeader += "Connection: close\r\n";
    sHeader += "\r\n";
  }
  else  {
    ulReqcount++;
    sResponse  = "<html><head><title>Wlan-Wetterstation im Auditorium</title></head><body>";
    sResponse += "<font color=\"#000000\" size=+1><body bgcolor=\"#d0d0f0\">";
    sResponse += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=yes\">";
    sResponse += "<h1>Wlan-Wetterstation im Auditorium</h1>";
    sResponse += "Temperatur: ";
    sResponse += cTemp;
    sResponse += "&deg;C <br>";
    sResponse += "Relative Luftfeuchtigkeit: ";
    sResponse += humidity;
    sResponse += "%<br>Absoluter Luftdruck: ";
    sResponse += P;
    sResponse += "hPa <br>";
    sResponse += "Relativer Luftdruck (Verwendete H&ouml;he: ";
    sResponse += ALTITUDE;
    sResponse += "m): ";
    sResponse += p0;
    sResponse += "hPa <br>";
    sResponse += "Funktion 1 schaltet GPIO2 und erzeugt eine serielle Ausgabe.<BR>";
    sResponse += "<p>Funktion 1 <a href=\"?pin=LEDON\"><button>einschalten</button></a>&nbsp;<a href=\"?pin=LEDOFF\"><button>ausschalten</button></a></p>";

    
    //////////////////////
    // react on parameters
    //////////////////////
    if (sCmd.length()>0) {
      // write received command to html page
      sResponse += "Kommando:" + sCmd + "<BR>";
      
      // switch GPIO
      if(sCmd.indexOf("LEDOFF")>=0)      {
        digitalWrite(2, 0);
      }
      else if(sCmd.indexOf("LEDON")>=0)      {
        digitalWrite(2, 1);
      }
    }
    
    sResponse += "<FONT SIZE=-2>";
    sResponse += "<BR>Aufrufz&auml;hler="; 
    sResponse += ulReqcount;
    sResponse += " - Verbindungsz&auml;hler="; 
    sResponse += ulReconncount;
    sResponse += "<BR>";
    sResponse += "Fabian Wildgrube, Rene Burger, AG GreenIOT, Sommerakademie Leysin 08/2016<BR>";
    sResponse += "Sensorstandort: Auditorium des Swiss Alpine Center in Leysin<BR>";
    sResponse += "</body></html>";
    
    sHeader  = "HTTP/1.1 200 OK\r\n";
    sHeader += "Content-Length: ";
    sHeader += sResponse.length();
    sHeader += "\r\n";
    sHeader += "Content-Type: text/html\r\n";
    sHeader += "Connection: close\r\n";
    sHeader += "\r\n";
  }
  
  // Send the response to the client
  client.print(sHeader);
  client.print(sResponse);
  
  // and stop the client
  client.stop();
  Serial.println("Client disconnected");
}
