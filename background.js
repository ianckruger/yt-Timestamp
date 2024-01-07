
//listen for updates in tab system
//find most recent/current tab and check if its YT

chrome.tabs.onUpdated.addListener((tabId, tab) => {
    // every youtube video has this followed by a ?, v= and a unique id
    // split where the ? is and grab the id (index 1)
    if (tab.url && tab.url.includes("youtube.com/watch")) {
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);

        //send message to contentScript with video ID to signifiy new video
        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            // since the id is v=uniqueid, grab the v that equals the id
            videoId: urlParameters.get("v"),
        });
    }
});

