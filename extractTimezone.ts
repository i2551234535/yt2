import * as fs from "fs";

const allText = fs.readFileSync("timezone.txt", "utf8");
const lines = allText.split("\n");
const allTimezone = [];
lines.forEach((line) => {
  if (line.indexOf("/") > 0) {
    const regex = /\S+{"(\S+)"}/;
    allTimezone.push(line.match(regex)[1]);
  }
});
fs.writeFileSync("allTimezone.json", JSON.stringify(allTimezone));
// console.log(allTimezone);
