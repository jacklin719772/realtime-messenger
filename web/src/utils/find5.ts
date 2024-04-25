/* Cool Javascript Find on this Page
Ver 5.3
Written by Jeff Baker on September, 8, 2007.
Copyright 2014 by Jeff Baker -
Version 5.0 created 7/16/2014
Updated 8/5/2019 ver 5.4d
http://www.seabreezecomputers.com/tips/find.htm
Paste the following javascript call in your HTML web page where
you want a button called "Find on this Page...":

<script type="text/javascript" language="JavaScript"
src="find5.js">
</script>

*/

/* You may edit the following variables */
var find_text_color = "black"; // the color of the text in window
//var find_window_height = 85; // height of window - Version 5.3f - No Longer Using
/* Do not edit the variables below this line */
var find_text_inter_span = "/"; // 找出文字个数的中间连接符

// Simple drag object to hold all the variables for dragging
var drag = {
  mousex: 0,
  mousey: 0,
  tempx: "",
  tempy: "",
  isdrag: false,
  drag_obj: null,
  drag_obj_x: 0,
  drag_obj_y: 0,
};

var find_timer = 0; // used for timer to move window in IE when scrolling

// Create highlights array to hold each new span element
var highlights: any[] = [];

// Which find are we currently highlighting
var find_pointer = -1;

var find_text = ""; // Global variable of searched for text

var found_highlight_rule = 0; // whether there is a highlight css rule
var found_selected_rule = 0; // whether there is a selected css rule

document.onmousedown = MouseDown;
document.onmousemove = MouseMove;
document.onmouseup = MouseUp;

document.ontouchstart = MouseDown;
document.ontouchmove = MouseMove;
document.ontouchend = MouseUp;

function highlight(word: string, node: HTMLElement | null) {
  if (!node) node = document.body;

  //var re = new RegExp(word, "i"); // regular expression of the search term // Ver 5.3c - Not using regular expressions search now

  for (node = node.firstChild; node; node = node.nextSibling) {
    //console.log(node.nodeName);
    if (node.nodeType == 3) {
      // text node
      var n = node;
      //console.log(n.nodeValue);
      var match_pos = 0;
      //for (match_pos; match_pos > -1; n=after)
      {
        //match_pos = n.nodeValue.search(re); // Ver 5.3b - Now NOT using regular expression because couldn't search for $ or ^
        match_pos = n.nodeValue.toLowerCase().indexOf(word.toLowerCase()); // Ver 5.3b - Using toLowerCase().indexOf instead

        if (match_pos > -1) {
          // if we found a match
          var before = n.nodeValue.substr(0, match_pos); // split into a part before the match
          var middle = n.nodeValue.substr(match_pos, word.length); // the matched word to preserve case
          //var after = n.splitText(match_pos+word.length);
          var after = document.createTextNode(
            n.nodeValue.substr(match_pos + word.length)
          ); // and the part after the match
          var highlight_span = document.createElement("span"); // create a span in the middle
          if (found_highlight_rule == 1) {
            highlight_span.className = "highlight";
          } else {
            highlight_span.style.backgroundColor = "yellow";
            highlight_span.style.color = "black";
          }

          highlight_span.appendChild(document.createTextNode(middle)); // insert word as textNode in new span
          n.nodeValue = before; // Turn node data into before
          n.parentNode.insertBefore(after, n.nextSibling); // insert after
          n.parentNode.insertBefore(highlight_span, n.nextSibling); // insert new span
          highlights.push(highlight_span); // add new span to highlights array
          highlight_span.id = "highlight_span" + highlights.length;
          node = node.nextSibling; // Advance to next node or we get stuck in a loop because we created a span (child)
        }
      }
    } // if not text node then it must be another element
    else {
      // nodeType 1 = element   原 matcher = /textarea|input/i   让input不支持搜索,现在把input从正则中去除,这个是定制化需求,看个人需要来改
      if (
        node.nodeType == 1 &&
        node.nodeName.match(/textarea/i) &&
        node.type.match(/textarea|text|number|search|email|url|tel/i) &&
        !getStyle(node, "display").match(/none/i)
      )
        textarea2pre(node);
      else {
        if (
          node.nodeType == 1 &&
          !getStyle(node, "visibility").match(/hidden/i)
        )
          if (node.nodeType == 1 && !getStyle(node, "display").match(/none/i))
            // Dont search in hidden elements
            // Dont search in display:none elements
            highlight(word, node);
      }
    }
  }
} // end function highlight(word, node)

function unhighlight() {
  for (var i = 0; i < highlights.length; i++) {
    var the_text_node = highlights[i].firstChild; // firstChild is the textnode in the highlighted span

    var parent_node = highlights[i].parentNode; // the parent element of the highlighted span

    // First replace each span with its text node nodeValue
    if (highlights[i].parentNode) {
      highlights[i].parentNode.replaceChild(the_text_node, highlights[i]);
      if (i == find_pointer) selectElementContents(the_text_node); // ver 5.1 - 10/17/2014 - select current find
      parent_node.normalize(); // The normalize() method removes empty Text nodes, and joins adjacent Text nodes in an element
      normalize(parent_node); // Ver 5.2 - 3/10/2015 - normalize() is incorrect in IE. It will combine text nodes but may leave empty text nodes. So added normalize(node) function below
    }
  }
  // Now reset highlights array
  highlights = [];
  find_pointer = -1; // ver 5.1 - 10/17/2014
} // end function unhighlight()

function normalize(node: { nodeType: number; nextSibling: { nodeType: number; nodeValue: any; }; nodeValue: any; parentNode: { removeChild: (arg0: any) => void; }; firstChild: any; }) {
  //http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
  if (!node) {
    return;
  }
  if (node.nodeType == 3) {
    while (node.nextSibling && node.nextSibling.nodeType == 3) {
      node.nodeValue += node.nextSibling.nodeValue;
      node.parentNode.removeChild(node.nextSibling);
    }
  } else {
    normalize(node.firstChild);
  }
  normalize(node.nextSibling);
}

function findit(root: string | null) {
  // put the value of the textbox in string
  var string = document.getElementById("fwtext").value;

  // 8-9-2010 Turn DIV to hidden just while searching so doesn't find the text in the window
  findwindow.style.visibility = "hidden";
  //findwindow.style.display = 'none';

  // if the text has not been changed and we have previous finds
  if (
    find_text.toLowerCase() ==
      document.getElementById("fwtext").value.toLowerCase() &&
    find_pointer >= 0
  ) {
    findnext(); // Find the next occurrence
  } else {
    unhighlight(); // Remove highlights of any previous finds

    if (string == "") {
      // if empty string
      find_msg.innerHTML = "";
      total.innerHTML = 0;
      document.getElementById("closeIcon").style.display = "none";
      findwindow.style.visibility = "visible";
      return;
    }

    find_text = string;

    // Ver 5.0a - 7/18/2014. Next four lines because root node won't exist until doc loads
    if (root != null) var node = document.getElementById(root);
    else var node = null;

    highlight(string, node); // highlight all occurrences of search string

    if (highlights.length > 0) {
      // if we found occurences
      find_pointer = -1;
      findnext(); // Find first occurrence
    } else {
      find_msg.innerHTML = " <b>0 " + find_text_inter_span + " 0</b>"; // ver 5.1 - 10/17/2014 - changed from "Not Found"
      find_pointer = -1;
      total.innerHTML = 0;
    }
  }
  findwindow.style.visibility = "visible";
  //findwindow.style.display = 'block';
} // end function findit()

function findnext() {
  var current_find;

  if (find_pointer != -1) {
    // if not first find
    current_find = highlights[find_pointer];

    // Turn current find back to yellow
    if (found_highlight_rule == 1) {
      current_find.className = "highlight";
    } else {
      current_find.style.backgroundColor = "yellow";
      current_find.style.color = "black";
    }
  }

  find_pointer++;

  if (find_pointer >= highlights.length)
    // if we reached the end
    find_pointer = 0; // go back to first find

  var display_find = find_pointer + 1;

  find_msg.innerHTML =
    display_find + "" + find_text_inter_span + "" + highlights.length;
  total.innerHTML = highlights.length;

  current_find = highlights[find_pointer];

  // Turn selected find orange or add .find_selected css class to it
  if (found_selected_rule == 1) {
    current_find.className = "find_selected";
  } else {
    current_find.style.backgroundColor = "orange";
    current_find.style.color = "black";
  }

  //highlights[find_pointer].scrollIntoView(); // Scroll to selected element
  scrollToPosition(highlights[find_pointer]);
} // end findnext()

// This function is to find backwards by pressing the Prev button
function findprev() {
  var current_find;
  if (highlights.length < 1) {
    return;
  }

  if (find_pointer != -1) {
    // if not first find
    current_find = highlights[find_pointer];

    // Turn current find back to yellow
    if (found_highlight_rule == 1) {
      current_find.className = "highlight";
    } else {
      current_find.style.backgroundColor = "yellow";
      current_find.style.color = "black";
    }
  }

  find_pointer--;

  if (find_pointer < 0)
    // if we reached the beginning
    find_pointer = highlights.length - 1; // go back to last find

  var display_find = find_pointer + 1;

  find_msg.innerHTML =
    display_find + "" + find_text_inter_span + "" + highlights.length;
  total.innerHTML = highlights.length;

  current_find = highlights[find_pointer];

  // Turn selected find orange or add .find_selected css class to it
  if (found_selected_rule == 1) {
    current_find.className = "find_selected";
  } else {
    current_find.style.backgroundColor = "orange";
    current_find.style.color = "black";
  }

  //highlights[find_pointer].scrollIntoView(); // Scroll to selected element
  scrollToPosition(highlights[find_pointer]);
} // end findprev()

// This function resets the txt selection pointer to the
// beginning of the body so that we can search from the
// beginning for the new search string when somebody
// enters new text in the find box

function MouseDown(event: Event | undefined) {
  drag.tempx = drag.tempy = ""; // For single click on object
  if (!event) event = window.event; // 10/5/2014 - ver 5.0d - for older IE <= 9
  var fobj = event.target || event.srcElement; // The element being clicked on (FF || IE)

  // get current screen scrollTop and ScrollLeft
  var scrollLeft =
    document.body.scrollLeft || document.documentElement.scrollLeft;
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

  // ver 5.1 - 10/17/2014 - Let users highlight textareas and inputs by not dragging them
  if (typeof fobj.nodeName != "undefined")
    if (
      fobj.nodeName.toLowerCase() == "input" ||
      fobj.nodeName.toLowerCase() == "textarea"
    )
      return true;

  // If parent or grandparents of obj is a dragme item then make the parent the fobj
  for (fobj; fobj; fobj = fobj.parentNode) {
    // 7/30/2014 ver 5.0b
    if (fobj.className) if (String(fobj.className).match(/dragme/i)) break;
  }

  if (fobj)
    if (fobj.className.match(/dragme/i)) {
      drag.isdrag = true; // Tell mouseMove we are dragging
      drag.drag_obj = fobj; // Put dragged element into global variable
      drag.drag_obj_x = parseInt(drag.drag_obj.offsetLeft); // get current x of element
      drag.drag_obj_y = parseInt(drag.drag_obj.offsetTop); // get current y of element

      // Add scrollTop and scrollLeft to recorded mouse position
      drag.mousex = event.clientX + scrollLeft;
      drag.mousey = event.clientY + scrollTop;

      /* if touchevents from iphone */
      if (event.type == "touchstart")
        if (event.touches.length == 1) {
          // Only deal with one finger
          var touch = event.touches[0]; // Get the information for finger #1
          // node.style.position = "absolute";
          drag.mousex = touch.pageX; // includes scroll offset
          drag.mousey = touch.pageY; // includes scroll offset
        }
      return true; // 8/25/2014 version 5.0c (Now all buttons and onclick work on iphone and android)
    }
} // end function MouseDown(event)

function MouseMove(event: Event | undefined) {
  if (drag.isdrag) {
    // Use 'event' above because IE only uses event and FF can use anything
    if (!event) event = window.event; // 10/5/2014 - ver 5.0d - for older IE <= 9
    drag.tempx = event.clientX; // record new mouse position x
    drag.tempy = event.clientY; // record new mouse position y

    // get current screen scrollTop and ScrollLeft
    var scrollLeft =
      document.body.scrollLeft || document.documentElement.scrollLeft;
    var scrollTop =
      document.body.scrollTop || document.documentElement.scrollTop;

    // Add scrollTop and scrollLeft to drag.tempx and drag.tempy
    drag.tempx += scrollLeft;
    drag.tempy += scrollTop;

    drag.drag_obj.style.position = "absolute";

    /* if touchevents from iphone */
    if (event.type == "touchmove")
      if (event.touches.length == 1) {
        // Only deal with one finger
        var touch = event.touches[0]; // Get the information for finger #1
        drag.tempx = touch.pageX; // includes scroll offset
        drag.tempy = touch.pageY; // includes scroll offset
      }

    drag.drag_obj.style.left =
      drag.drag_obj_x + drag.tempx - drag.mousex + "px"; // 7/30/2014 ver 5.0b
    drag.drag_obj.style.top = drag.drag_obj_y + drag.tempy - drag.mousey + "px"; // 7/30/2014 ver 5.0b
    return false;
  }
} // end function MouseMove(event)

function MouseUp() {
  if (drag.isdrag == true) {
    if (drag.tempx == "" && drag.tempy == "") {
      //if (document.getElementById('find_msg'))
      // document.getElementById('find_msg').innerHTML += " You clicked!";
    }
  }

  drag.isdrag = false;
}

function isOnScreen(el: { getBoundingClientRect: () => any; }) {
  // Version 5.4d
  /* This checks to see if an element is within the current user viewport or not */
  var scrollLeft =
    document.body.scrollLeft || document.documentElement.scrollLeft;
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
  var screenHeight =
    window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight; // Version 1.2.0
  var screenWidth =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth; // Version 1.2.0

  /* New way: el.getBoundingClientRect always returns
     left, top, right, bottom of
     an element relative to the current screen viewport */
  var rect = el.getBoundingClientRect();
  if (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= screenHeight &&
    rect.left <= screenWidth
  )
    // Version 1.2.0 - Changed from scrollBottom and scrollRight
    return true;
  else {
    // Verison 1.0.2 - Calculate how many pixels it is offscreen
    var distance = Math.min(
      Math.abs(rect.bottom),
      Math.abs(rect.right),
      Math.abs(rect.top - screenHeight),
      Math.abs(rect.left - screenWidth)
    );

    return -Math.abs(distance); // Version 1.0.2 - Return distance as a negative. Used to return false if off screen
  }
}

function scrollToPosition(field: { scrollIntoView: (arg0: boolean) => void; }) {
  // This function scrolls to the DIV called 'edited'
  // It is called with onload.  'edited' only exists if
  // they just edited a comment or the last comment
  // if they just sent a comment
  var scrollLeft =
    document.body.scrollLeft || document.documentElement.scrollLeft;
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

  if (field) {
    if (isOnScreen(field) != true) {
      // Version 5.4d
      var isSmoothScrollSupported =
        "scrollBehavior" in document.documentElement.style;
      if (isSmoothScrollSupported) {
        field.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        field.scrollIntoView(false);
      }
    }
  }
}

/* It is not possible to get certain styles set in css such as display using
the normal javascript.  So we have to use this function taken from:
http://www.quirksmode.org/dom/getstyles.html */
function getStyle(el: string, styleProp: string) {
  // if el is a string of the id or the actual object of the element
  var x = document.getElementById(el) ? document.getElementById(el) : el;
  if (x.currentStyle)
    // IE
    var y = x.currentStyle[styleProp];
  else if (window.getComputedStyle)
    // FF
    var y = document.defaultView
      .getComputedStyle(x, null)
      .getPropertyValue(styleProp);
  return y;
}

function create_div_html(isShowTxt: any, root: string) {
  console.log("enter this method create_div_html");
  if (document.documentElement.scrollTop)
    var current_top = document.documentElement.scrollTop;
  else var current_top = document.body.scrollTop;

  if (document.getElementById("findwindow")) {
    console.log("have find findwindow");
    findwindow = document.getElementById("findwindow");
  } else {
    findwindow.id = "findwindow";
    findwindow.style.position = "absolute";
    document.body.appendChild(findwindow);
    document.body.insertBefore(findwindow, document.body.firstChild);
    findwindow.className = "findwindow dragme";
    findwindow.style.visibility = "hidden";
  }
  findwindow.style.display = "flex";
  findwindow.style.alignItems = "center";
  findwindow.style.justifyContent = "space-around";
  findwindow.style.flexWrap = "wrap";
  findwindow.style.color = find_text_color;
  findwindow.style.padding = "0px";
  findwindow.style.fontSize = "14px";
  findwindow.className = "outMain";

  var string = "";
  var searchIcon =
    '<div id="searchIcon" style="display: flex;align-items: center;justify-content: center;cursor: pointer;width: 30px;cursor: pointer;"><svg focusable="false" class="" data-icon="search" width="1em" height="1em" fill="#6C6C6C" aria-hidden="true" viewBox="64 64 896 896"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path></svg></div>';
  var closeIcon =
    '<div id="closeIcon" style="display: none;align-items: center;cursor: pointer;"><svg focusable="false" class="" data-icon="close-circle" width="1em" height="1em" fill="#E3E6ED" aria-hidden="true" viewBox="64 64 896 896"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path></svg></div>';
  string +=
    '<div id="look" style="color: #363636">查找:</div>' +
    '<div id="window_body" style="padding-left: 15px;height: 35px;border: 1px solid #DCDFE6;border-radius: 5px;background-color: #fff;width: 500px">' +
    '<form onsubmit="return false;"><div style="display: flex;padding: 3px;"><input autocomplete="off"' +
    ' class="paperview-input-text focus:outline-none focus:ring-0 text-sm" ' +
    ' style="float:left;height: 27px;width: 500px;border: none;outline: 0px;" id="fwtext"' +
    ' placeholder="Search messages..."/>' +
    closeIcon +
    searchIcon +
    "</div>";
  string +=
    "</form></div>" +
    '<div class="searchRight" style=" display: flex; width: 300px">' +
    '<div class="res"  style=" display: flex;justify-content: space-around;align-items: center;">' +
    `<div class="txt th-color-for" style="font-size: 14px;">Results：<span id="total">0</span></div>` +
    '<div id="btnUp" class="btn item th-bg-bg border-2 rounded th-border-for th-color-for text-xs" style="display: flex;justify-content: center;align-items: center;width: 68px;height: 24px; margin: 12px 2px;cursor: pointer;margin-left: 10px;">Prev</div>' +
    '<div id="btnDown" class="btn item th-bg-bg border-2 rounded th-border-for th-color-for text-xs" style="display: flex;justify-content: center;align-items: center;width: 68px;height: 24px; margin: 12px 2px;cursor: pointer;">Next</div>' +
    '<div class="txt" id="find_msg"  style="font-size: 14px; color: #6c6c6c;margin-left: 10px;">0/0</div>' +
    "</div>" +
    "</div>";
  // ^zxd - 05/24/2023

  findwindow.innerHTML = string;
  // search input 实时监听文本内容变化 , 一直输入一直搜索,比onchange失去焦点搜索好一点
  var fwtextDom = document.getElementById("fwtext");
  let btnUp = document.getElementById("btnUp");
  let btnDown = document.getElementById("btnDown");
  let closeDom = document.getElementById("closeIcon");
  let searchDom = document.getElementById("searchIcon");
  let windowBody = document.getElementById("window_body");
  if (isShowTxt) {
    windowBody.style.margin = "0px 10px";
  }
  if (document.all) {
    // ie浏览器的监听事件
    console.log("onpropertychange method only for IE");
    fwtextDom.onpropertychange = () => {
      findit(root);
      // findit方法会如果网页中找不到search txt会失去 鼠标输入焦点,变得不可以再输入,需要设置find_pointer为一直到不到元素,才不会失去焦点
      find_pointer = -1;
    };
  } else {
    // 其他浏览器的监听事件
    console.log("oninput method for Chrome and other except IE");
    // 点击搜索
    searchDom.onclick = () => {
      findit(root);
    };
    fwtextDom.oninput = function () {
      // findit方法会如果网页中找不到search txt会失去 鼠标输入焦点,变得不可以再输入,需要设置find_pointer为一直到不到元素,才不会失去焦点
      find_pointer = -1;
      if (fwtextDom.value) {
        document.getElementById("closeIcon").style.display = "flex";
      }
    };
    btnUp.onclick = () => {
      findprev();
    };
    btnDown.onclick = () => {
      findit(root);
    };
    fwtextDom.onkeydown = (event) => {
      if (event.code === "Enter") {
        findit(root);
      }
    };
    closeDom.onclick = () => {
      fwtextDom.value = "";
      findit(root);
    };
  }

  // Check to see if css rules exist for hightlight and find_selected.
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    // IE <= 8 uses rules; FF & Chrome and IE 9+ users cssRules
    try {
      // Version 5.4c - Fix Firefox "InvalidAccessError: A parameter or an operation is not supported by the underlying object" bug
      var rules = sheets[i].rules ? sheets[i].rules : sheets[i].cssRules;
      if (rules != null)
        for (var j = 0; j < rules.length; j++) {
          if (rules[j].selectorText == ".highlight") found_highlight_rule = 1;
          else if (rules[j].selectorText == ".find_selected")
            found_selected_rule = 1;
        }
    } catch (error) {
      console.error("Caught Firefox CSS loading error: " + error);
    }
  }
  return string;
}

function textarea2pre(el: Element) {
  // el is the textarea element

  // If a pre has already been created for this textarea element then use it
  if (el.nextSibling && el.nextSibling.id && el.nextSibling.id.match(/pre_/i))
    var pre = el.nextsibling;
  else var pre = document.createElement("pre");

  var the_text = el.value; // All the text in the textarea

  // replace <>" with entities
  the_text = the_text.replace(/>/g, ">").replace(/</g, "<").replace(/"/g, '"');
  //var text_node = document.createTextNode(the_text); // create text node for pre with text in it
  //pre.appendChild(text_node); // add text_node to pre
  pre.innerHTML = the_text;

  // Copy the complete HTML style from the textarea to the pre
  var completeStyle = "";
  if (typeof getComputedStyle !== "undefined") {
    // webkit
    completeStyle = window.getComputedStyle(el, null).cssText;
    if (completeStyle != "")
      // Verison 5.3f - Is empty in IE 10 and Firefox
      pre.style.cssText = completeStyle; // Everything copies fine in Chrome
    else {
      // Version 5.3f - Because cssText is empty in IE 10 and Firefox
      var style = window.getComputedStyle(el, null);
      for (var i = 0; i < style.length; i++) {
        completeStyle +=
          style[i] + ": " + style.getPropertyValue(style[i]) + "; ";
      }
      pre.style.cssText = completeStyle;
    }
  } else if (el.currentStyle) {
    // IE
    var elStyle = el.currentStyle;
    for (var k in elStyle) {
      completeStyle += k + ":" + elStyle[k] + ";";
    }
    //pre.style.cssText = completeStyle;
    pre.style.border = "1px solid black"; // border not copying correctly in IE
  }

  el.parentNode.insertBefore(pre, el.nextSibling); // insert pre after textarea

  // If textarea blur then turn pre back on and textarea off
  el.onblur = function () {
    this.style.display = "none";
    pre.style.display = "block";
  };
  // If textarea changes then put new value back in pre
  el.onchange = function () {
    pre.innerHTML = el.value
      .replace(/>/g, ">")
      .replace(/</g, "<")
      .replace(/"/g, '"');
  };

  el.style.display = "none"; // hide textarea
  pre.id = "pre_" + highlights.length; // Add id to pre

  // Set onclick to turn pre off and turn textarea back on and perform a click on the textarea
  // for a possible onclick="this.select()" for the textarea
  pre.onclick = function () {
    this.style.display = "none";
    el.style.display = "block";
    el.focus();
    el.click();
  };

  // this.parentNode.removeChild(this); // old remove pre in onclick function above
} // end function textarea2pre(el)

// ver 5.1 - 10/17/2014
function selectElementContents(el: Node) {
  /* http://stackoverflow.com/questions/8019534/how-can-i-use-javascript-to-select-text-in-a-pre-node-block */
  if (window.getSelection && document.createRange) {
    // IE 9 and non-IE
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (document.body.createTextRange) {
    // IE < 9
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.select();
    //textRange.execCommand("Copy");
  }
} // end function selectElementContents(el)

// This part creates a visible button on the HTML page to
// where the script is pasted in the HTML code
// document.write('<input type="button" value="Find on this page..."'
//   + ' onclick="show();">');

// Create the DIV
var findwindow = document.createElement("div");

// setTimeout("initFindWin()", 5000)

// 启动初始化函数,必须要在插件渲染完成之后再初始化,不然就会创建新的div函数,所以vue使用 mounted 初始化
const initFindWin = (isShowTxt: boolean, root = "body") => {
  create_div_html(isShowTxt, root);
  document.getElementById("look").style.display = isShowTxt ? "block" : "none";
};
export default initFindWin;
