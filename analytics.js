Raphael.fn.drawGrid = function (x, y, w, h, wv, hv, color) {
    color = color || "#000";
    var path = ["M", Math.round(x) + .5, Math.round(y) + .5, "L", Math.round(x + w) + .5, Math.round(y) + .5, Math.round(x + w) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y + h) + .5, Math.round(x) + .5, Math.round(y) + .5],
        rowHeight = h / hv,
        columnWidth = w / wv;
    for (var i = 1; i < hv; i++) {
        path = path.concat(["M", Math.round(x) + .5, Math.round(y + i * rowHeight) + .5, "H", Math.round(x + w) + .5]);
    }
    for (i = 1; i < wv; i++) {
        path = path.concat(["M", Math.round(x + i * columnWidth) + .5, Math.round(y) + .5, "V", Math.round(y + h) + .5]);
    }
    return this.path(path.join(",")).attr({stroke: color});
};

$(function () {
    $("#data").css({
        position: "absolute",
        left: "-9999em",
        top: "-9999em"
    });
});

function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
    var l1 = (p2x - p1x) / 2,
        l2 = (p3x - p2x) / 2,
        a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
        b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
    a = p1y < p2y ? Math.PI - a : a;
    b = p3y < p2y ? Math.PI - b : b;
    var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
        dx1 = l1 * Math.sin(alpha + a),
        dy1 = l1 * Math.cos(alpha + a),
        dx2 = l2 * Math.sin(alpha + b),
        dy2 = l2 * Math.cos(alpha + b);
    return {
        x1: p2x - dx1,
        y1: p2y + dy1,
        x2: p2x + dx2,
        y2: p2y + dy2
    };
}

var PLAN_COLOR   = "green";
var USUAL_COLOR  = "#00B358";
var LINE_COLOR   = "#01939A";
var RUN_COLOR    = "#FFB473";
var TRAIN_COLOR  = "#FF6700";
var TRAUMA_COLOR = "#FF0000";

function getDateByIndex(index) {
  var days = [30, 31, 30];
  var mons = ["Апреля", "Мая", "Июня"];
  var stepIndex = Math.floor(index);

  for(var i = 0; days.length; i++) {
    if (stepIndex < days[i]) {
      return (stepIndex + 1) + " " + mons[i] + " 2013";
    }
    stepIndex -= days[i];
  }
  throw ("Invalid index: " + index);

}

function processData(input) {
    var data = [];
    var count = 0;
    for(var i = 0; i < input.length; i++) {
        var parts = input[i].split(",");
        for (var j = 0; j < parts.length; j++) {
            var part = $.trim(parts[j]);
            if (part == "?") {
                count++;
                continue;
            }
            var color = USUAL_COLOR;
            if (part[part.length - 1] == 'T') {
                part = part.substring(0, part.length - 1);
                color = TRAIN_COLOR;
            }
            if (part[part.length - 1] == 'Z') {
                part = part.substring(0, part.length - 1);
                color = TRAUMA_COLOR;
            }
            if (part.indexOf("-") > 0) {
                var doubleNum = part.split("-");
                var first  = $.trim(doubleNum[0]);
                var second = $.trim(doubleNum[1]);
                data.push(new Point(count++, first, color));
                data.push(new Point(count - .7, getLowStr(first, second), RUN_COLOR));
            } else {
                data.push(new Point(count++, part, color));
            }
        }
    }
    return data;
}

function getLowStr(n1, sub) {
    var n10 = n1 * 10 - sub;
    return Math.floor(n10 / 10) + "." + n10 % 10;
}

function Point(day, val, color) {
    this.day = day;
    this.val = val;
    this.msg = "Вес: " + val;
    this.color = color;
}

window.onload = function () {
    // Fill data
    var input = [];
    $("#data tbody td").each(function () {
    	input.push($(this).html());
    });    
    var data = processData(input);
    var pointsCount = 30 + 31 + 30;

    // Draw
    var width = 1200,
        height = 600,
        leftgutter = 30,
        bottomgutter = 20,
        topgutter = 20,
        color = LINE_COLOR,
        r = Raphael("holder", width, height),
        txt = {font: '12px Helvetica, Arial', fill: "#fff"},
        txt1 = {font: '10px Helvetica, Arial', fill: "#fff"},
        txt2 = {font: '12px Helvetica, Arial', fill: "#000"},
        X = (width - leftgutter) / pointsCount,
        max = 82,
        min = 70,
        Y = (height - bottomgutter - topgutter) / (max - min);

    // Grid
    r.drawGrid(leftgutter + X * .5 + .5, topgutter + .5, width - leftgutter - X, height - topgutter - bottomgutter, 13, 12, "#000");

    var path = r.path().attr({stroke: color, "stroke-width": 2, "stroke-linejoin": "round"}),
        bgp = r.path().attr({stroke: "none", opacity: .3, fill: color}),
        label = r.set(),
        lx = 0, ly = 0,
        is_label_visible = false,
        leave_timer,
        blanket = r.set();
    label.push(r.text(60, 12, "Вес: xx.x").attr(txt));
    label.push(r.text(60, 27, "xx Апреля 2013").attr(txt1).attr({fill: color}));
    label.hide();
    var frame = r.popup(100, 100, label, "right").attr({fill: "#000", stroke: "#666", "stroke-width": 2, "fill-opacity": .7}).hide();

    // Y axis
    for(var i = 0; i < 13; i++) {
        var x = Math.round(leftgutter + X * .5);
        var y = Math.round(topgutter + Y * i);
        r.text(x - 15, y, (82 - i)).attr(txt).toBack();
    }

    // X axis
    var monthSize = (width - leftgutter) / 3;
    r.text(monthSize / 2 + leftgutter, height - 6, "Апрель").attr(txt).toBack();
    r.text(3 * monthSize / 2 + leftgutter, height - 6, "Май").attr(txt).toBack();
    r.text(5 * monthSize / 2 + leftgutter, height - 6, "Июнь").attr(txt).toBack();

    for(var i = 0; i < 13; i++) {
        var x = Math.round(leftgutter + X * .5);
        var y = Math.round(topgutter + Y * i);
        r.text(x - 15, y, (82 - i)).attr(txt).toBack();
    }

    // plan
    var planX1 = leftgutter + X * .5,
        planY1 = topgutter,
        planX2 = width - 5,
        planY2 = height - bottomgutter;

    var plan = ["M", planX1, planY1, "L", planX2, planY2];
    r.path(plan).attr({stroke: PLAN_COLOR, "stroke-width": 2, "stroke-linejoin": "round"});
    r.circle(planX1, planY1, 3).attr({fill: PLAN_COLOR, stroke: "none"});
    r.circle(planX2, planY2, 3).attr({fill: PLAN_COLOR, stroke: "none"});

    // legend
    var legendTxt = {font: '12px Helvetica, Arial', fill: "#fff", 'text-anchor': 'start'};
    var lgdX = leftgutter + X * 9 * 7 - 1;
    var lgdY = topgutter + Y + 1;
    r.rect(lgdX, lgdY, X * 7 * 2 - 3, Y * 3 - 1).attr({fill: "#333", stroke: "none", opacity: 1});
    var lgdText   = ["Цель", "Утренний вес", "Дни тренировок", "Вес после пробежки", "Травма"];
    var lgdColors = [PLAN_COLOR, USUAL_COLOR, TRAIN_COLOR, RUN_COLOR, TRAUMA_COLOR];
    for(var i = 0; i < lgdText.length; i++) {
        var y = lgdY + 20 + 25 * i;
        r.circle(lgdX + 20, y, 5).attr({fill: lgdColors[i], stroke: "none"});
        r.text(lgdX + 35, y, lgdText[i]).attr(legendTxt).toFront();
    }

    // data
    var p, bgpp;
    for (var i = 0; i < data.length; i++) {
        var y = Math.round(height - bottomgutter - Y * (data[i].val - min)),
            x = Math.round(leftgutter + X * (data[i].day + .5));

        if (!i) {
            p = ["M", x, y, "C", x, y];
            bgpp = ["M", leftgutter + X * .5, height - bottomgutter, "L", x, y, "C", x, y];
        }
        if (i && i < data.length - 1) {
            var Y0 = Math.round(height - bottomgutter - Y * data[i - 1].val),
                X0 = Math.round(leftgutter + X * (data[i - 1].day + .5)),
                Y2 = Math.round(height - bottomgutter - Y * data[i + 1].val),
                X2 = Math.round(leftgutter + X * (data[i + 1].day + .5));
            var a = getAnchors(X0, Y0, x, y, X2, Y2);
            p = p.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
            bgpp = bgpp.concat([a.x1, a.y1, x, y, a.x2, a.y2]);
        }
        var dot = r.circle(x, y, 3).attr({fill: data[i].color, stroke: "none"});
        blanket.push(r.rect(leftgutter + X * data[i].day, 0, X, height - bottomgutter).attr({stroke: "none", fill: "#fff", opacity: 0}));
        var rect = blanket[blanket.length - 1];
        (function (x, y, data, lbl, dot) {
            var timer, i = 0;
            rect.hover(function () {
                clearTimeout(leave_timer);
                var side = "right";
                if (x + frame.getBBox().width > width) {
                    side = "left";
                }
                var ppp = r.popup(x, y, label, side, 1),
                    anim = Raphael.animation({
                        path: ppp.path,
                        transform: ["t", ppp.dx, ppp.dy]
                    }, 200 * is_label_visible);
                lx = label[0].transform()[0][1] + ppp.dx;
                ly = label[0].transform()[0][2] + ppp.dy;
                frame.show().stop().animate(anim);

                label[0].attr({text: data.msg}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);
                label[1].attr({text: getDateByIndex(lbl)}).show().stop().animateWith(frame, anim, {transform: ["t", lx, ly]}, 200 * is_label_visible);

                dot.attr("r", 6);
                is_label_visible = true;
            }, function () {
                dot.attr("r", 3);
                leave_timer = setTimeout(function () {
                    frame.hide();
                    label[0].hide();
                    label[1].hide();
                    is_label_visible = false;
                }, 1);
            });
        })(x, y, data[i], data[i].day, dot);
    }
    p = p.concat([x, y, x, y]);
    bgpp = bgpp.concat([x, y, x, y, "L", x, height - bottomgutter, "z"]);
    path.attr({path: p});
    //bgp.attr({path: bgpp});
    frame.toFront();
    label[0].toFront();
    label[1].toFront();
    blanket.toFront();
};