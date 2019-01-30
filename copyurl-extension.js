'use strict';

// Sqaaakoi 2019

// Edit below to customise the text, images, prompts and notifications.

const meta = {
  defaultIcon: "icons/Copy.png",
  copiedIcon: "icons/Copied.png",
  errorIcon: "icons/CopyError.png",
  hoverText: "Click to copy URL",
  copiedHoverText: "Copied URL: %url",
  copiedNotificationTitle: "Copied URL",
  copiedNotificationText: "%url",
  copiedNotificationIcon: "icons/CopiedNotification.png",
  silentNotifications: false,
  persistentNotifications: false,
  enableNotifications: true,
  errorHoverText: "Couldn't copy URL",
  errorNotificationTitle: "Couldn't copy URL",
  errorNotificationText: "URL is not allowed to be copied",
  errorNotificationIcon: "icons/CopyErrorNotification.png",
  silentErrorNotifications: false,
  persistentErrorNotifications: false,
  enableErrorNotifications: true,
  allowOnNewTab: false,
  disableCopyList: [],
  copiedTimer: 4250,
  errorTimer: 2750,
  shareTitleDefault: "Share this page",
  shareCommentPrompt: "Add a comment? Click cancel to cancel sharing. \nThe URL you are sharing is %url",
  shareMethodDefault: "POST",
  shareUrlDefault: "",
  shareContentMaxLengthDefault: 1024,
  shareContent: "{\"content\":\"%%jsonEscapedInfo %jsonEscapedData\"}",
  shareContentType: "application/json",
  shareBlocked: "URL is not allowed to be shared.",
  editShareText: "✏ Edit Share Data",
  stopEditingShareText: "✏ Stop Editing Share Data",
  infoMD: "[ℹ](https://sqaaakoi.github.io/CopyURL/info)"
};

// Code below: Please only edit if you understand what you are doing.

function copy(text) {
  let textbox = document.createElement("textarea");
  textbox.style.opacity = 0;
  textbox.value = text;
  document.body.appendChild(textbox);
  textbox.select();
  document.execCommand("copy");
  textbox.blur();
  document.body.removeChild(textbox);
  textbox.remove();
};

function copyURL(tab) {
  if (!tab) return false;
  let vtab = {
    url: tab.url,
    id: tab.id
  };
  let allow = true;
  if (vtab.url == "chrome://newtab/" && !meta.allowOnNewTab) {
    allow = false;
  }
  if (meta.disableCopyList.length > 0) {
    meta.disableCopyList.forEach((u) => {
      if (u == tab.url) {
        allow = false;
      };
    });
  };
  if (allow) {
    copy(vtab.url);
    chrome.browserAction.setIcon({path: meta.copiedIcon, tabId: vtab.id});
    chrome.browserAction.setTitle({title: meta.copiedHoverText.replace("%url", vtab.url), tabId: vtab.id});
  } else {
    chrome.browserAction.setIcon({path: meta.errorIcon, tabId: vtab.id});
    chrome.browserAction.setTitle({title: meta.errorHoverText.replace("%url", vtab.url), tabId: vtab.id});
  }
  chrome.notifications.getPermissionLevel((ne) => {
    let notify = allow ? ne == "granted" && meta.enableNotifications : ne == "granted" && meta.enableErrorNotifications;
    if (notify) {
      let notificationInfo = allow ? {
        type: "basic",
        title: meta.copiedNotificationTitle.replace("%url", vtab.url),
        message: meta.copiedNotificationText.replace("%url", vtab.url),
        iconUrl: meta.copiedNotificationIcon,
        priority: 0,
        requireInteraction: meta.persistentNotifications,
        silent: meta.silentNotifications
      } : {
        type: "basic",
        title: meta.errorNotificationTitle.replace("%url", vtab.url),
        message: meta.errorNotificationText.replace("%url", vtab.url),
        iconUrl: meta.errorNotificationIcon,
        priority: 0,
        requireInteraction: meta.persistentErrorNotifications,
        silent: meta.silentErrorNotifications
      };
      chrome.notifications.create("copyURL-" + vtab.id, notificationInfo);
    };
    let delay = allow ? meta.copiedTimer : meta.errorTimer;
    setTimeout(() => {
      chrome.tabs.query({}, (tabs) => {
        let tabExistsLater = false;
        if (tabs.length > 0) {
          tabs.forEach((tablater) => {
            if (tablater.id == vtab.id) {
              tabExistsLater = true;
            };
          });
        };
        if (tabExistsLater) {
          chrome.browserAction.setIcon({path: meta.defaultIcon, tabId: vtab.id});
          chrome.browserAction.setTitle({title: meta.hoverText, tabId: vtab.id});
        };
      });
      if (notify) {
        chrome.notifications.clear("copyURL-" + vtab.id);
      };
    }, delay);
  });
};

function context(info, tab) {
  if (info.menuItemId == "edit") {
    chrome.storage.local.get('edit', function(dataEdit) {
      if (!dataEdit.edit) {
        chrome.storage.local.set({edit: true}, function() {
          alert("Click on any share link to edit it.");
          chrome.contextMenus.update("edit", {
            title: meta.stopEditingShareText,
            contexts: ["browser_action"]
          });
        });
      } else {
        chrome.storage.local.set({edit: false}, function() {
          chrome.contextMenus.update("edit", {
            title: meta.editShareText,
            contexts: ["browser_action"]
          });
        });
      };
    });
  } else if (info.menuItemId.startsWith("share")) {
    chrome.storage.local.get(['share', 'edit'], function(sendData) {
      let pos = parseInt(info.menuItemId.split("").slice(5), 10);
      if (sendData.edit || (sendData.share[pos].url === null || sendData.share[pos].url === "")) {
        chrome.storage.local.set({edit: false}, function() {
          chrome.contextMenus.update("edit", {
            title: meta.editShareText,
            contexts: ["browser_action"]
          });
          let title = prompt("Title for share button in the context menu.", sendData.share[pos].title);
          if (title === null || title === "") return;
          let url = prompt("URL for share requests.", sendData.share[pos].url);
          if (url === null || url === "") return;
          let method = prompt("Method for share requests.", sendData.share[pos].method);
          if (method === null || method === "") return;
          let data = prompt("Data for share requests. Use %data to replace with url + comment. \nIf using JSON, replace \"%\" with \"%jsonEscaped\". Capitalize the next letter after that or it won't work. \n%info = Markdown info button \n%data = URL and comment \n%title = Title of page \n%favicon = Favicon URL", sendData.share[pos].data);
          if (data === null || data === "") return;
          let ct = prompt("Content-Type for share requests.", sendData.share[pos].content_type);
          if (ct === null || ct === "") return;
          let length = prompt("Max Length for share request content.", sendData.share[pos].length);
          if (length === null || length === "") return;
          let confirmation = confirm("Share Title: " + title + "\nShare Request URL: " + url + "\nShare Request Method: " + method + "\nShare Request Data: " + data + "\nShare Request Content-Type: " + ct + "\nShare Request Content Length: " + length);
          if (confirmation) {
            let shareData = sendData.share;
            shareData[pos] = {title: title, url: url, method: method, data: data, content_type: ct, length: length};
            chrome.storage.local.set({share: shareData}, function() {});
            chrome.contextMenus.update("share" + pos, {
              title: title,
              enabled: true,
              contexts: ["browser_action"]
            });
          } else {
            return;
          };
        });
      } else {
        if (sendData.share[pos].url === null || sendData.share[pos].url === "") return;
        let allow = true;
        if (tab.url == "chrome://newtab/" && !meta.allowOnNewTab) {
          allow = false;
        }
        if (meta.disableCopyList.length > 0) {
          meta.disableCopyList.forEach((u) => {
            if (u == tab.url) {
              allow = false;
            };
          });
        };
        if (!allow) {
          alert(meta.shareBlocked.replace("%url", tab.url));
          return;
        }
        let comment = prompt(meta.shareCommentPrompt.replace("%url", tab.url));
        if (comment === null) return;
        let escapeJSON = (j) => {
          let o = j.replace("\\", "\\\\").replace("\b", "\\b").replace("\t", "\\t").replace("\n", "\\n").replace("\f", "\\f").replace("\r", "\\r").replace("\"", "\\\"");
          return o;
        }
        let text = (tab.url + " " + comment);
        let jsoninfo = escapeJSON(meta.infoMD);
        let jsonescaped = escapeJSON(text);
        let jsontitle = escapeJSON(tab.title).split("");
        let jsonfavicon = escapeJSON(tab.faviconUrl ? tab.faviconUrl : "");
        let send_data = sendData.share[pos].data.replace("%jsonEscapedInfo", jsoninfo).replace("%jsonEscapedData", jsonescaped).replace("%jsonEscapedTitle", jsontitle).replace("%jsonEscapedFavicon", jsonfavicon).replace("%info", meta.infoMD).replace("%data", text).replace("%title", tab.title).replace("%favicon", tab.faviconUrl ? tab.faviconUrl : "").split("").slice(0, parseInt(sendData.share[pos].length, 10)).join("");
        var settings = {
          "async": true,
          "url": sendData.share[pos].url,
          "Content_Type": sendData.share[pos].content_type,
          "method": sendData.share[pos].method,
          "data": send_data
        };
        var xhrreq = new XMLHttpRequest();
        xhrreq.open(settings.method, settings.url, settings.async);
        xhrreq.setRequestHeader("Content-Type", settings.Content_Type);
        xhrreq.send(settings.data);
      };
    });
  };
};

function init() {
  chrome.browserAction.setIcon({path: meta.defaultIcon});
  chrome.browserAction.setTitle({title: meta.hoverText});
  chrome.contextMenus.removeAll();
  chrome.storage.local.get('share', function(shg) {
    let enableShare = shg.share.url === null || shg.share.url === "" ? false : true;
    chrome.contextMenus.create({
      title: shg.share[0].title,
      id: "share0",
      enabled: enableShare,
      contexts: ["browser_action"]
    }, function() {
      chrome.contextMenus.create({
        title: shg.share[1].title,
        id: "share1",
        enabled: enableShare,
        contexts: ["browser_action"]
      }, function() {
        chrome.contextMenus.create({
          title: shg.share[2].title,
          id: "share2",
          enabled: enableShare,
          contexts: ["browser_action"]
        }, function() {
          chrome.contextMenus.create({
            title: meta.editShareText,
            id: "edit",
            contexts: ["browser_action"]
          });
        });
      });
    });
  });
};

function installInit(i) {
  if (i.reason == "install") {
    let shareDefaults = {title: meta.shareTitleDefault, url: meta.shareUrlDefault, method: meta.shareMethodDefault, data: meta.shareContent, content_type: meta.shareContentType, length: meta.shareContentMaxLengthDefault};
    chrome.storage.local.set({share: [shareDefaults, shareDefaults, shareDefaults]}, function() {});
    init();
  } else {
    init();
  }
};

chrome.browserAction.onClicked.addListener(copyURL);
chrome.runtime.onStartup.addListener(init);
chrome.runtime.onInstalled.addListener(installInit);
chrome.contextMenus.onClicked.addListener(context);
