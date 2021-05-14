let why = {
    end_message: "GAME OVER!",
    font: 'monospace',
    text_color: "white",
    background_color: "black",
    link_color: "white",
    link_hover: "yellow",
    font_size: 20,
    text_delay: 20,
    game_width: 0,

    run_custom_code() {
        let game = this.game;
        let code = "";
        let got_code = false;
        for(let i = 0; i < game.length; i++) {
            if(game[i] === '/' && game[i+1] === '~') {
                eval(code.slice(2, code.length-2));
                return true;
            }
            if(game[i] === '~' && game[i+1] === '/') {
                got_code = true;
            }
            if(got_code) {
                code += game[i];
            }
        }
        return false;
    },

    game: null,

    current_idx: -1,

    find_index: async function(idx) {

        if(this.current_idx === -1) {
            why.run_custom_code();
        }
        let div1 = $("div.o1");
        div1.empty();
        let div2 = $("div.o2");
        div2.empty();
        if(idx === "-1") {
            let div1 = $("div.o1");
            div1.empty();
            let div2 = $("div.o2");
            div2.empty();
            this.display_text(this.end_message);
            return;
        }
        let game = this.game;
        this.current_idx = idx;

        let doc = game.split("\n");

        let found_line = doc.find((line) => {
            return line.startsWith("["+idx+"]") || line.startsWith("{"+idx+"}");
        });

        let regex_options = /^\[(\d+)] (.+)[ ]*<([\w,]+) ([-]*.+),[ ]*([\w,]+) ([-]*.+)>;/g;

        let regex_if = /^{(\d+)} (.+)[ ]*<([-]*.+),[ ]*([-]*.+)>;/g;

        let regex_assign = /^{(\d+)} #(.+)[ ]*<([-]*.+)>;/g;

        let regex_continue = /^\[(\d+)] (.+)[ ]*<(\w+) ([-]*.+)>;/g;

        let regex_variable_inline_continue = /^\[(\d+)] (.+)[ ]*({#(.+?)})(.+)[ ]*<(\w+) ([-]*.+)>;/g;

        let regex_variable_inline_options = /^\[(\d+)] (.+)[ ]*({#(.+?)})[ ]*(.+)[ ]*<([\w,]+) ([-]*.+),[ ]*([\w,]+) ([-]*.+)>;/g;

        let match_options = regex_options.exec(found_line);
        let match_if = regex_if.exec(found_line);
        let match_assign = regex_assign.exec(found_line);
        let match_variable_inline_continue = regex_variable_inline_continue.exec(found_line);
        let match_continue = regex_continue.exec(found_line);
        let match_variable_inline_options = regex_variable_inline_options.exec(found_line);

        if(match_variable_inline_options) {
            let str = match_variable_inline_options[2] + eval(match_variable_inline_options[4]) + match_variable_inline_options[5];
            let str2 = "<div>" + str.replace(/{\$(\w+) (.+?)}/g, " <div style='display: inline-block; color: $1'>$2</div>") + "</div>";
            await this.display_text(str2);
            await this.format_options(match_variable_inline_options[6], match_variable_inline_options[7], match_variable_inline_options[8], match_variable_inline_options[9]);
            return true;
        }

        if(match_options) {
            let str = match_options[2].replace(/{\$(\w+) (.+?)}/g, " <div style='display: inline-block; color: $1'>$2</div>");
            await this.display_text("<div>" + str + "</div>");
            await this.format_options(match_options[3], match_options[4], match_options[5], match_options[6]);
            return true;
        }

        if(match_if) {
            if(eval(match_if[2])) {
                this.find_index(match_if[3]);
            } else {
                this.find_index(match_if[4]);
            }
            return true;
        }

        if(match_assign) {
            eval(match_assign[2]);
            this.find_index(eval(match_assign[3]));
            return true;
        }

        if(match_variable_inline_continue) {
            if(typeof match_variable_inline_continue[4] !== "string") {
                let str = match_variable_inline_continue[2] + match_variable_inline_continue[4] + match_variable_inline_continue[5];
                await this.display_text("<div>" + str.replace(/{\$(\w+) (.+?)}/g, " <div style='display: inline-block; color: $1'>$2</div>") + "</div>");
            } else {
                let str = match_variable_inline_continue[2] + eval(match_variable_inline_continue[4]) + match_variable_inline_continue[5];
                await this.display_text("<div>" + str.replace(/{\$(\w+) (.+?)}/g, " <div style='display: inline-block; color: $1'>$2</div>") + "</div>");
            }
            await this.format_options(match_variable_inline_continue[6], match_variable_inline_continue[7]);
            return true;
        }

        if(match_continue) {
            await this.display_text("<div>" + match_continue[2].replace(/{\$(\w+) (.+?)}/g, " <div style='display: inline-block; color: $1'>$2</div>") + "</div>");
            await this.format_options(match_continue[3], match_continue[4]);
            return true;
        }

        throw "line syntax invalid. its probably the next index, or a missing semicolon. line idx: " + idx;
    },

    format_options: async function(op1, res1, op2, res2) {
        if(this.current_idx === 0 || this.current_idx === 13 || this.current_idx === 15) {
            await this.sleep(500);
            this.find_index(res1);
            return;
        }
        let div1 = $("div.o1");
        div1.empty();
        let div2 = $("div.o2");
        div2.empty();

        div1.append("<div id='" + eval(res1) + "' onclick='why.find_index(this.id)'><u>" + op1.toString().replace(/_/g, " ") + "</u></div>");
        div2.css("width", 0);
        div1.css("width", this.game_width);
        if(op2) {
            div2.css("width", this.game_width/2);
            div1.css("width", this.game_width/2);
            div2.append("<div id='" + eval(res2) + "' onclick='why.find_index(this.id)'><u>" + op2.toString().replace(/_/g, " ") + "</u></div>");
        }
    },

    display_text: async function(str)
    {
        let new_str = "";
        let text = $(".text");
        let amp_delay = 0;
        let default_delay = this.text_delay;
        for(let i = 0; i < str.length; i++) {
            new_str += str[i];
            if(str[i] === "&") {
                amp_delay = 1;
                this.text_delay = 0;
            }
            if(amp_delay !== 0) {
                amp_delay++;
            }
            if(str[i] === ";" && amp_delay !== 0) {
                amp_delay = 0;
                this.text_delay = default_delay;
            }
            if(amp_delay !== 0) continue;
            if(str[i] === "<") this.text_delay = 0;
            if(str[i] === ">") this.text_delay = default_delay;
            if(str[i] === ">" || str[i] === "<") continue;
            text.empty();
            text.append("<div>" + new_str + "</div>");
            if(this.text_delay !== 0) {
                await this.sleep(this.text_delay);
            }
        }
        text.empty();
        text.append("<div>" + str + "</div>");
        return true;
    },

    create_game: function(width, height, idx) {
        $.get('game.txt', (data) => {
            this.game = data;
            if(this.run_custom_code()) {
                console.log('preferences loaded');
            }
            console.log('game loaded! game length: ' + data.length + ' characters');
            this.game_width = width;
            $("body").append("<div class='game' style='margin: 50px auto auto; width: " + width + "px; height: " + height + "px; font-family: " + this.font +"'>");
            let cont = $(".game");
            cont.append("<div class='text' style='width: " + width + "px; height: " + height*(7/8) + "px; color: " + this.text_color + "; background-color: " + this.background_color + "; font-size: " + this.font_size + "px;'>\nif you are seeing this, then the code loaded before the game file. try refreshing a couple times!</div>");
            cont.append("<div class='option o1' style='width: " + width/2 + "px; height: " + height*(1/8) + "px; color: " + this.link_color + "; background-color: " + this.background_color + "; text-align: center; float: left; font-size: " + this.font_size + "px;'></div>");
            cont.append("<div class='option o2' style='width: " + width/2 + "px; height: " + height*(1/8) + "px; color: " + this.link_color + "; background-color: " + this.background_color + "; text-align: center; float: right; font-size: " + this.font_size + "px;'></div>");
            $("head").append("<style> u:hover {color: " + this.link_hover + "; cursor: pointer; }</style>");
            this.find_index(idx);
        }, "text");
    },

    rng_range: function(min, max) {
        return (Math.floor(Math.random() * (max - min) ) + min).toString();
    },
    
    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};