const request = require("request");
const cheerio = require("cheerio");
const {jsPDF} = require("jspdf");
let fs = require("fs");
let data = {};
let $;

function linkGenerator(error, response, body) {
  if (!error && response.statusCode == 200) {
    $ = cheerio.load(body);

    let allTopicsName = $(
      ".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1"
    );
    let allTopicsURL = $(
      ".no-underline.d-flex.flex-column.flex-justify-center"
    );

    for (let x = 0; x < allTopicsURL.length; x++) {
      getTopicPage(
        $(allTopicsName[x]).text().trim(),
        "http://www.github.com/" + $(allTopicsURL[x]).attr("href")
      );
      console.log($(allTopicsName[x]).text().trim());
      console.log("http://www.github.com/" + $(allTopicsURL[x]).attr("href"));
    }
  }
}


function getTopicPage(name, url) {
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //fs.writeFileSync(name+".html", body);

      //project link with name of that page

      $ = cheerio.load(body);
      let allProjects = $(
        ".f3.color-text-secondary.text-normal.lh-condensed .text-bold"
      );

      if(allProjects.length >8){
        allProjects = allProjects.slice(0,8);
      }

      for (let x = 0; x < allProjects.length; x++) {
        let projectTitle = $(allProjects[x]).text().trim();
        let projectLinks = "http://www.github.com/" + $(allProjects[x]).attr("href");

        if (!data[name]) {
          data[name] = [{ name: projectTitle, link: projectLinks }];
        } else {
          data[name].push({ name: projectTitle, link: projectLinks });
        }
        if (x < 5) {
          getIssuePage(projectTitle, name, projectLinks + "/issues");
        }
      }
      //fs.writeFileSync("data.json", JSON.stringify(data));
    }
  });
}

function getIssuePage(projectName, topicName, url) {
  request(url, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);

      let issues = $(
        ".Link--primary.v-align-middle.no-underline.h4.js-navigation-open"
      );

      for (let x = 0; x < issues.length; x++) {
        let issueName = $(issues).text().trim();
        let issueLink = "http://www.github.com/" + $(issues).attr("href");

        let index = -1;
        
        for (let y = 0; y < data[topicName].length; y++) {
          if (data[topicName][y].name === projectName) {
            index = y;
            break;
          }
        }

        if (!data[topicName][index].issues) {
          data[topicName][index].issues = [{ issueName, issueLink }];
        } else {
          data[topicName][index].issues.push({ issueName, issueLink });
        }
      }
      fs.writeFileSync("data.json", JSON.stringify(data));
      pdfGenerator(data);
    }
  });
}

function pdfGenerator(d){
  for(x in d){
    if(!fs.existsSync(x))
      fs.mkdirSync(x);
    let path = "./" + x + "/";

    for(y in d[x]){
      const doc = new jsPDF();
      let issueArr = d[x][y].issues;
      let spacing = 1;

      for(z in issueArr){
        doc.text(issueArr[z].issueName, 10, 11*spacing);
        doc.text(issueArr[z].issueLink, 10, 11*spacing+5);
        spacing+= 2;
      }

      if(fs.existsSync(path+d[x][y].name+".pdf")){
        fs.unlinkSync(path+d[x][y].name + ".pdf");
      }
      doc.save(path + d[x][y].name + ".pdf");
    }
  }

}

request("http://www.github.com/topics", linkGenerator);
