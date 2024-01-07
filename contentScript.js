(() => {
    // accessing youtube players and controls to manipulate
    let youtubeLeftControls, youtubePlayer;
    //string sent from background.js as a message
    let currentVideo = "";
    // store current video bookmarks
    let currentVideoBookmarks = [];


    // get all bookmarks when new video is loaded
    const fetchBookmarks = () => {
        //look in storage to see if current video (aka index the object (obj[currentVideo])) has any bookmarks
        // if it exists in storage, JSON.parse it (since it was JSON.stringified)
        //if it doesnt return an empty array
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj)=> {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]): []);
            });
        });
    };


    const newVideoLoaded = async () => {
        //check if bookmark button exists
        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];

        currentVideoBookmarks = await fetchBookmarks();

        //if not, add to any youtube plater
        // add conditional to make sure this isnt loaded twice (not major if not added)
        if (!bookmarkBtnExists) {
            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "ytp-button " + "bookmark-btn";
            bookmarkBtn.title = "Click to bookmark current timestamp";

            //grab controls
            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName('video-stream')[0];

            //add bookmark button
            youtubeLeftControls.appendChild(bookmarkBtn);
            
            //add listener to listen to clicks on icon
            bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
        }
    };


    const addNewBookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
          time: currentTime,
          desc: "Bookmark at " + getTime(currentTime),
        };
    
        currentVideoBookmarks = await fetchBookmarks();
    
        //sync to chrome storage
        // each video (according to id) maps back to set of bookmarks
        // add name of bookmark here
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        });
      };

    //add listener for incoming message from background.js
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        // if the video is a new one, load new storage
        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type === 'PLAY') { // else if the message is play, play time sent
            youtubePlayer.currentTime = value;
        } else if (type === "DELETE") {
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

            //send updated bookmarks to popup.js to display most recent ones
            response(currentVideoBookmarks);
        }
    });

    newVideoLoaded();
})();

const getTime = t => {
    var date = new Date(0);
    date.setSeconds(t);

    return date.toISOString().substr(11,8);
};
