// moment.js
// version : 1.7.0
// author : Tim Wood
// license : MIT
// momentjs.com

// moment.lang_ja.js
// このスクリプトは　moment.js の表示文言部分を日本語でオーバーライドしたものです。
// ライセンスは本家を継承します。

// 本家moment.jsのあとに呼んでください。

// 例：
// <script src="moment.js"></script>
// <script src="moment.lang_ja.js"></script>

// 作成者：佐藤　毅 （株式会社ジーティーアイ　http://gti.jp ）

		moment.lang('ja', {
//        months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
//        monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
//        weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : "日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"),
//        weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : "（日）_（月）_（火）_（水）_（木）_（金）_（土）".split("_"),
//        weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
		weekdaysMin : "日_月_火_水_木_金_土".split("_"),
        longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },
        calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[last] dddd [at] LT',
            sameElse : 'L'
        },
        relativeTime : {
            future : "%s後",
            past : "%s前",
//            s : "a few seconds",
			s : "ちょっと",
//            m : "a minute",
            m : "約1分",
//            mm : "%d minutes",
            mm : "%d分",
//            h : "an hour",
            h : "約1時間",
//            hh : "%d hours",
            hh : "%d時間",
//            d : "a day",
            d : "1日",
//            dd : "%d days",
            dd : "%d日",
//            M : "a month",
            M : "1ヶ月",
//            MM : "%d months",
            MM : "%dヶ月",
//            y : "a year",
            y : "1年",
//            yy : "%d years"
            yy : "%d年"
        },
        ordinal : function (number) {
            var b = number % 10;
            return (~~ (number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        }
    });