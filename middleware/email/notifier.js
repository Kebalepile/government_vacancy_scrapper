import nodemailer from "nodemailer";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
config("../../.env");

console.log( process.env.EMAIL,
  process.env.PASSWORD)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// console.log(transporter)
const subscribers = ["kmotshoana@gmail.com"];

function date(type = "date") {
  const pad = (num) => num.toString().padStart(2, "0"),
    date = new Date(),
    year = date.getFullYear(),
    month = date.toLocaleString("default", { month: "long" }),
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds();

  const currentDate = `${day}-${pad(month)}-${pad(year)}`;
  const currentTime = ` ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  switch (type.trim().toLowerCase()) {
    case "date":
      return currentDate;
    case "time":
      return currentTime;
    default:
      return {
        date: currentDate,
        time: currentTime,
      };
  }
}
function queryDatabase(query =date().replaceAll("-", " ").toUpperCase(), callback) {
  
  const directoryPath = "../../database";
  try {
    fs.readdir(directoryPath, (error, files) => {
      if (error) {
        console.log(`Error reading directory: ${error.message}`);
        return;
      }
      const matchingFiles = files.filter((file) =>
        file.includes(query)
      );
     
      matchingFiles.forEach((file) => {
        const filePath = path.join(directoryPath, file);
        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error(`Error reading file: ${err.message}`);
            return;
          }
          const jsonData = JSON.parse(data);
          callback(jsonData);
        });
      });
    });
  } catch (error) {
    console.log(error.message);
  }
}
export function dailyAlerts() {
  
  const dailyUpdate = (info) => {
   
    try {
      if (subscribers.length) {
        for (const subscriber of subscribers) {
          const eMailOptions = {
            from: `"Bot Alerts" ${transporter.auth.user}`,
            to: subscriber,
            subject: "Bot Alerts Daily government job posts.",
            text: "Good Day  Here are to days latest goverment job post updates",
            html: `<h2>${date("date").replaceAll("-", " ")} Updates</h2> 
            <hr/> 
            <br/>
            <ul>${info.list
              .map(
                (source) =>
                  `<li><a href="${source.sourceLink}">${source.text}</a></li>`
              )
              .join("")}</ul>`,
          };
console.log(subscriber)
          transporter.sendMail(eMailOptions, (error, info) => {
            if (error) {
              return console.log(error);
            }
            console.log(`Message sent: ${info.messageId}`);
          });
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  queryDatabase(date().replaceAll("-", " ").toUpperCase(), dailyUpdate);
}

dailyAlerts();