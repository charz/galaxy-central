var IconButton=Backbone.Model.extend({defaults:{title:"",icon_class:"",on_click:null,menu_options:null,is_menu_button:true,id:null,href:null,target:null,enabled:true,visible:true,tooltip_config:{}}});var IconButtonView=Backbone.View.extend({initialize:function(){this.model.attributes.tooltip_config={placement:"bottom"};this.model.bind("change",this.render,this)},render:function(){this.$el.tooltip("hide");var a=this.template(this.model.toJSON());a.tooltip(this.model.get("tooltip_config"));this.$el.replaceWith(a);this.setElement(a);return this},events:{click:"click"},click:function(a){if(_.isFunction(this.model.get("on_click"))){this.model.get("on_click")(a);return false}return true},template:function(b){var a='title="'+b.title+'" class="icon-button';if(b.is_menu_button){a+=" menu-button"}a+=" "+b.icon_class;if(!b.enabled){a+="_disabled"}a+='"';if(b.id){a+=' id="'+b.id+'"'}a+=' href="'+b.href+'"';if(b.target){a+=' target="'+b.target+'"'}if(!b.visible){a+=' style="display: none;"'}if(b.enabled){a="<a "+a+"/>"}else{a="<span "+a+"/>"}return $(a)}});var IconButtonCollection=Backbone.Collection.extend({model:IconButton});var IconButtonMenuView=Backbone.View.extend({tagName:"div",initialize:function(){this.render()},render:function(){var a=this;this.collection.each(function(d){var b=$("<a/>").attr("href","javascript:void(0)").attr("title",d.attributes.title).addClass("icon-button menu-button").addClass(d.attributes.icon_class).appendTo(a.$el).click(d.attributes.on_click);if(d.attributes.tooltip_config){b.tooltip(d.attributes.tooltip_config)}var c=d.get("options");if(c){make_popupmenu(b,c)}});return this}});var create_icon_buttons_menu=function(b,a){if(!a){a={}}var c=new IconButtonCollection(_.map(b,function(d){return new IconButton(_.extend(d,a))}));return new IconButtonMenuView({collection:c})};var Grid=Backbone.Collection.extend({});var GridView=Backbone.View.extend({});var PopupMenu=Backbone.View.extend({initialize:function(b,a){this.$button=b;if(!this.$button.size()){this.$button=$("<div/>")}this.options=a||[];var c=this;this.$button.click(function(d){$(".popmenu-wrapper").remove();c._renderAndShow(d);return false})},_renderAndShow:function(a){this.render();this.$el.appendTo("body").css(this._getShownPosition(a)).show();this._setUpCloseBehavior()},render:function(){this.$el.addClass("popmenu-wrapper").hide().css({position:"absolute"}).html(this.template(this.$button.attr("id"),this.options));if(this.options.length){var a=this;this.$el.find("li").each(function(c,b){var d=a.options[c];if(d.func){$(this).children("a.popupmenu-option").click(function(e){d.func.call(a,e,d)})}})}return this},template:function(b,a){return['<ul id="',b,'-menu" class="dropdown-menu">',this._templateOptions(a),"</ul>"].join("")},_templateOptions:function(a){if(!a.length){return"<li>(no options)</li>"}return _.map(a,function(d){if(d.divider){return'<li class="divider"></li>'}else{if(d.header){return['<li class="head"><a href="javascript:void(0);">',d.html,"</a></li>"].join("")}}var c=d.href||"javascript:void(0);",e=(d.target)?(' target="'+d.target+'"'):(""),b=(d.checked)?('<span class="fa fa-check"></span>'):("");return['<li><a class="popupmenu-option" href="',c,'"',e,">",b,d.html,"</a></li>"].join("")}).join("")},_getShownPosition:function(b){var c=this.$el.width();var a=b.pageX-c/2;a=Math.min(a,$(document).scrollLeft()+$(window).width()-c-5);a=Math.max(a,$(document).scrollLeft()+5);return{top:b.pageY,left:a}},_setUpCloseBehavior:function(){var c=this;function a(e){$(document).off("click.close_popup");if(window.parent!==window){try{$(window.parent.document).off("click.close_popup")}catch(d){}}else{try{$("iframe#galaxy_main").contents().off("click.close_popup")}catch(d){}}c.remove()}$("html").one("click.close_popup",a);if(window.parent!==window){try{$(window.parent.document).find("html").one("click.close_popup",a)}catch(b){}}else{try{$("iframe#galaxy_main").contents().one("click.close_popup",a)}catch(b){}}},addItem:function(b,a){a=(a>=0)?a:this.options.length;this.options.splice(a,0,b);return this},removeItem:function(a){if(a>=0){this.options.splice(a,1)}return this},findIndexByHtml:function(b){for(var a=0;a<this.options.length;a++){if(_.has(this.options[a],"html")&&(this.options[a].html===b)){return a}}return null},findItemByHtml:function(a){return this.options[(this.findIndexByHtml(a))]},toString:function(){return"PopupMenu"}});PopupMenu.create=function _create(b,a){return new PopupMenu(b,a)};PopupMenu.make_popupmenu=function(b,c){var a=[];_.each(c,function(f,d){var e={html:d};if(f===null){e.header=true}else{if(jQuery.type(f)==="function"){e.func=f}}a.push(e)});return new PopupMenu($(b),a)};PopupMenu.convertLinksToOptions=function(c,a){c=$(c);a=a||"a";var b=[];c.find(a).each(function(g,e){var f={},d=$(g);f.html=d.text();if(d.attr("href")){var j=d.attr("href"),k=d.attr("target"),h=d.attr("confirm");f.func=function(){if((h)&&(!confirm(h))){return}switch(k){case"_parent":window.parent.location=j;break;case"_top":window.top.location=j;break;default:window.location=j}}}b.push(f)});return b};PopupMenu.fromExistingDom=function(d,c,a){d=$(d);c=$(c);var b=PopupMenu.convertLinksToOptions(c,a);c.remove();return new PopupMenu(d,b)};PopupMenu.make_popup_menus=function(c,b,d){c=c||document;b=b||"div[popupmenu]";d=d||function(e,f){return"#"+e.attr("popupmenu")};var a=[];$(c).find(b).each(function(){var e=$(this),f=$(c).find(d(e,c));a.push(PopupMenu.fromDom(f,e));f.addClass("popup")});return a};var faIconButton=function(a){a=a||{};a.tooltipConfig=a.tooltipConfig||{placement:"bottom"};a.classes=["icon-btn"].concat(a.classes||[]);if(a.disabled){a.classes.push("disabled")}var b=['<a class="',a.classes.join(" "),'"',((a.title)?(' title="'+a.title+'"'):("")),((!a.disabled&&a.target)?(' target="'+a.target+'"'):("")),' href="',((!a.disabled&&a.href)?(a.href):("javascript:void(0);")),'">','<span class="fa ',a.faIcon,'"></span>',"</a>"].join("");var c=$(b).tooltip(a.tooltipConfig);if(_.isFunction(a.onclick)){c.click(a.onclick)}return c};function LoadingIndicator(a,c){var b=this;c=jQuery.extend({cover:false},c||{});function d(){var e=['<div class="loading-indicator">','<div class="loading-indicator-text">','<span class="fa fa-spinner fa-spin fa-lg"></span>','<span class="loading-indicator-message">loading...</span>',"</div>","</div>"].join("\n");var g=$(e).hide().css(c.css||{position:"fixed"}),f=g.children(".loading-indicator-text");if(c.cover){g.css({"z-index":2,top:a.css("top"),bottom:a.css("bottom"),left:a.css("left"),right:a.css("right"),opacity:0.5,"background-color":"white","text-align":"center"});f=g.children(".loading-indicator-text").css({"margin-top":"20px"})}else{f=g.children(".loading-indicator-text").css({margin:"12px 0px 0px 10px",opacity:"0.85",color:"grey"});f.children(".loading-indicator-message").css({margin:"0px 8px 0px 0px","font-style":"italic"})}return g}b.show=function(f,e,g){f=f||"loading...";e=e||"fast";b.$indicator=d().insertBefore(a);b.message(f);b.$indicator.fadeIn(e,g);return b};b.message=function(e){b.$indicator.find("i").text(e)};b.hide=function(e,f){e=e||"fast";if(b.$indicator&&b.$indicator.size()){b.$indicator.fadeOut(e,function(){b.$indicator.remove();if(f){f()}})}else{if(f){f()}}return b};return b}(function(){function a(j,p){var d=27,m=13,c=$(j),e=true,g={initialVal:"",name:"search",placeholder:"search",classes:"",onclear:function(){},onfirstsearch:null,onsearch:function(q){},minSearchLen:0,escWillClear:true,oninit:function(){}};function i(q){var r=$(this).parent().children("input");r.val("");r.trigger("clear:searchInput");p.onclear()}function o(r,q){$(this).trigger("search:searchInput",q);if(typeof p.onfirstsearch==="function"&&e){e=false;p.onfirstsearch(q)}else{p.onsearch(q)}}function f(){return['<input type="text" name="',p.name,'" placeholder="',p.placeholder,'" ','class="search-query ',p.classes,'" ',"/>"].join("")}function l(){return $(f()).focus(function(q){$(this).select()}).keyup(function(r){if(r.which===d&&p.escWillClear){i.call(this,r)}else{var q=$(this).val();if((r.which===m)||(p.minSearchLen&&q.length>=p.minSearchLen)){o.call(this,r,q)}else{if(!q.length){i.call(this,r)}}}}).val(p.initialVal)}function k(){return $(['<span class="search-clear fa fa-times-circle" ','title="',_l("clear search (esc)"),'"></span>'].join("")).tooltip({placement:"bottom"}).click(function(q){i.call(this,q)})}function n(){return $(['<span class="search-loading fa fa-spinner fa-spin" ','title="',_l("loading..."),'"></span>'].join("")).hide().tooltip({placement:"bottom"})}function h(){c.find(".search-loading").toggle();c.find(".search-clear").toggle()}if(jQuery.type(p)==="string"){if(p==="toggle-loading"){h()}return c}if(jQuery.type(p)==="object"){p=jQuery.extend(true,{},g,p)}return c.addClass("search-input").prepend([l(),k(),n()])}jQuery.fn.extend({searchInput:function b(c){return this.each(function(){return a(this,c)})}})}());(function(){function b(m,l){this.currModeIndex=0;return this.init(m,l)}b.prototype.DATA_KEY="mode-button";b.prototype.defaults={modes:[{mode:"default"}]};b.prototype.init=function f(m,l){l=l||{};this.$element=$(m);this.options=jQuery.extend(true,{},this.defaults,l);var o=this;this.$element.click(function n(p){o.callModeFn();o._incModeIndex();$(this).html(o.options.modes[o.currModeIndex].html)});this.currModeIndex=0;if(this.options.initialMode){this.currModeIndex=this._getModeIndex(this.options.initialMode)}return this};b.prototype._getModeIndex=function j(l){for(var m=0;m<this.options.modes.length;m+=1){if(this.options.modes[m].mode===l){return m}}throw new Error("mode not found: "+l)};b.prototype.getCurrMode=function a(){return this.options.modes[this.currModeIndex]};b.prototype.getMode=function g(l){if(!l){return this.getCurrMode()}return this.options.modes[(this._getModeIndex(l))]};b.prototype.hasMode=function k(l){return !!this.getMode(l)};b.prototype.currentMode=function e(){return this.options.modes[this.currModeIndex]};b.prototype.setMode=function c(m){var l=this.getMode(m);this.$element.html(l.html||null);return this};b.prototype._incModeIndex=function d(){this.currModeIndex+=1;if(this.currModeIndex>=this.options.modes.length){this.currModeIndex=0}return this};b.prototype.callModeFn=function h(l){var m=this.getMode(l).onclick;if(m&&jQuery.type(m==="function")){return m.call(this)}return undefined};jQuery.fn.extend({modeButton:function i(m){var l=jQuery.makeArray(arguments).slice(1);return this.map(function(){var p=$(this),o=p.data("mode-button");if(jQuery.type(m)==="object"){o=new b(p,m);p.data("mode-button",o)}else{if(o&&jQuery.type(m)==="string"){var n=o[m];if(jQuery.type(n)==="function"){return n.apply(o,l)}}else{if(o){return o}}}return this})}})}());function dropDownSelect(b,c){c=c||((!_.isEmpty(b))?(b[0]):(""));var a=$(['<div class="dropdown-select btn-group">','<button type="button" class="btn btn-default">','<span class="dropdown-select-selected">'+c+"</span>","</button>","</div>"].join("\n"));if(b&&b.length>1){a.find("button").addClass("dropdown-toggle").attr("data-toggle","dropdown").append(' <span class="caret"></span>');a.append(['<ul class="dropdown-menu" role="menu">',_.map(b,function(e){return['<li><a href="javascript:void(0)">',e,"</a></li>"].join("")}).join("\n"),"</ul>"].join("\n"))}function d(g){var h=$(this),f=h.parents(".dropdown-select"),e=h.text();f.find(".dropdown-select-selected").text(e);f.trigger("change.dropdown-select",e)}a.find("a").click(d);return a}(function(){function e(k,j){return this.init(k,j)}e.prototype.DATA_KEY="filter-control";e.prototype.init=function g(k,j){j=j||{filters:[]};this.$element=$(k).addClass("filter-control btn-group");this.options=jQuery.extend(true,{},this.defaults,j);this.currFilter=this.options.filters[0];return this.render()};e.prototype.render=function d(){this.$element.empty().append([this._renderKeySelect(),this._renderOpSelect(),this._renderValueInput()]);return this};e.prototype._renderKeySelect=function a(){var j=this;var k=this.options.filters.map(function(l){return l.key});this.$keySelect=dropDownSelect(k,this.currFilter.key).addClass("filter-control-key").on("change.dropdown-select",function(m,l){j.currFilter=_.findWhere(j.options.filters,{key:l});j.render()._triggerChange()});return this.$keySelect};e.prototype._renderOpSelect=function i(){var j=this,k=this.currFilter.ops;this.$opSelect=dropDownSelect(k,k[0]).addClass("filter-control-op").on("change.dropdown-select",function(m,l){j._triggerChange()});return this.$opSelect};e.prototype._renderValueInput=function c(){var j=this;if(this.currFilter.values){this.$valueSelect=dropDownSelect(this.currFilter.values,this.currFilter.values[0]).on("change.dropdown-select",function(l,k){j._triggerChange()})}else{this.$valueSelect=$("<input/>").addClass("form-control").on("change",function(k,l){j._triggerChange()})}this.$valueSelect.addClass("filter-control-value");return this.$valueSelect};e.prototype.val=function b(){var k=this.$element.find(".filter-control-key .dropdown-select-selected").text(),m=this.$element.find(".filter-control-op .dropdown-select-selected").text(),j=this.$element.find(".filter-control-value"),l=(j.hasClass("dropdown-select"))?(j.find(".dropdown-select-selected").text()):(j.val());return{key:k,op:m,value:l}};e.prototype._triggerChange=function h(){this.$element.trigger("change.filter-control",this.val())};jQuery.fn.extend({filterControl:function f(k){var j=jQuery.makeArray(arguments).slice(1);return this.map(function(){var n=$(this),m=n.data(e.prototype.DATA_KEY);if(jQuery.type(k)==="object"){m=new e(n,k);n.data(e.prototype.DATA_KEY,m)}if(m&&jQuery.type(k)==="string"){var l=m[k];if(jQuery.type(l)==="function"){return l.apply(m,j)}}return this})}})}());(function(){function i(o,n){this.numPages=null;this.currPage=0;return this.init(o,n)}i.prototype.DATA_KEY="pagination";i.prototype.defaults={startingPage:0,perPage:20,totalDataSize:null,currDataSize:null};i.prototype.init=function g(n,o){o=o||{};this.$element=n;this.options=jQuery.extend(true,{},this.defaults,o);this.currPage=this.options.startingPage;if(this.options.totalDataSize!==null){this.numPages=Math.ceil(this.options.totalDataSize/this.options.perPage);if(this.currPage>=this.numPages){this.currPage=this.numPages-1}}this.$element.data(i.prototype.DATA_KEY,this);this._render();return this};function m(n){return $(['<li><a href="javascript:void(0);">',n,"</a></li>"].join(""))}i.prototype._render=function e(){if(this.options.totalDataSize===0){return this}if(this.numPages===1){return this}if(this.numPages>0){this._renderPages();this._scrollToActivePage()}else{this._renderPrevNext()}return this};i.prototype._renderPrevNext=function b(){var o=this,p=m("Prev"),n=m("Next"),q=$("<ul/>").addClass("pagination pagination-prev-next");if(this.currPage===0){p.addClass("disabled")}else{p.click(function(){o.prevPage()})}if((this.numPages&&this.currPage===(this.numPages-1))||(this.options.currDataSize&&this.options.currDataSize<this.options.perPage)){n.addClass("disabled")}else{n.click(function(){o.nextPage()})}this.$element.html(q.append([p,n]));return this.$element};i.prototype._renderPages=function a(){var n=this,q=$("<div>").addClass("pagination-scroll-container"),s=$("<ul/>").addClass("pagination pagination-page-list"),r=function(t){n.goToPage($(this).data("page"))};for(var o=0;o<this.numPages;o+=1){var p=m(o+1).attr("data-page",o).click(r);if(o===this.currPage){p.addClass("active")}s.append(p)}return this.$element.html(q.html(s))};i.prototype._scrollToActivePage=function l(){var p=this.$element.find(".pagination-scroll-container");if(!p.size()){return this}var o=this.$element.find("li.active"),n=p.width()/2;p.scrollLeft(p.scrollLeft()+o.position().left-n);return this};i.prototype.goToPage=function j(n){if(n<=0){n=0}if(this.numPages&&n>=this.numPages){n=this.numPages-1}if(n===this.currPage){return this}this.currPage=n;this.$element.trigger("pagination.page-change",this.currPage);this._render();return this};i.prototype.prevPage=function c(){return this.goToPage(this.currPage-1)};i.prototype.nextPage=function h(){return this.goToPage(this.currPage+1)};i.prototype.page=function f(){return this.currPage};i.create=function k(n,o){return new i(n,o)};jQuery.fn.extend({pagination:function d(o){var n=jQuery.makeArray(arguments).slice(1);if(jQuery.type(o)==="object"){return this.map(function(){i.create($(this),o);return this})}var q=$(this[0]),r=q.data(i.prototype.DATA_KEY);if(r){if(jQuery.type(o)==="string"){var p=r[o];if(jQuery.type(p)==="function"){return p.apply(r,n)}}else{return r}}return undefined}})}());(function(){var g={renameColumns:false,columnNames:[],commentChar:"#",hideCommentRows:false,includePrompts:true,topLeftContent:"Columns:"},s="peek-control.change",t="peek-control.rename",l="peek-control",v="control",f="control-prompt",c="selected",n="disabled",u="button",q="renamable-header",p="column-index",a="column-name";function i(w){if(w.disabled&&jQuery.type(w.disabled)!=="array"){throw new Error('"disabled" must be defined as an array of indeces: '+JSON.stringify(w))}if(w.multiselect&&w.selected&&jQuery.type(w.selected)!=="array"){throw new Error('Mulitselect rows need an array for "selected": '+JSON.stringify(w))}if(!w.label||!w.id){throw new Error("Peek controls need a label and id for each control row: "+JSON.stringify(w))}if(w.disabled&&w.disabled.indexOf(w.selected)!==-1){throw new Error("Selected column is in the list of disabled columns: "+JSON.stringify(w))}return w}function o(x,w){return $("<div/>").addClass(u).text(x.label)}function k(x,w){var y=$("<td/>").html(o(x,w)).attr("data-"+p,w);if(x.disabled&&x.disabled.indexOf(w)!==-1){y.addClass(n)}return y}function e(y,z,w){var x=y.children("."+u);if(y.hasClass(c)){x.html((z.selectedText!==undefined)?(z.selectedText):(z.label))}else{x.html((z.unselectedText!==undefined)?(z.unselectedText):(z.label))}}function h(z,x){var y=k(z,x);if(z.selected===x){y.addClass(c)}e(y,z,x);if(!y.hasClass(n)){y.click(function w(D){var E=$(this);if(!E.hasClass(c)){var A=E.parent().children("."+c).removeClass(c);A.each(function(){e($(this),z,x)});E.addClass(c);e(E,z,x);var C={},B=E.parent().attr("id"),F=E.data(p);C[B]=F;E.parents(".peek").trigger(s,C)}})}return y}function m(z,x){var y=k(z,x);if(z.selected&&z.selected.indexOf(x)!==-1){y.addClass(c)}e(y,z,x);if(!y.hasClass(n)){y.click(function w(D){var E=$(this);E.toggleClass(c);e(E,z,x);var C=E.parent().find("."+c).map(function(G,H){return $(H).data(p)});var B={},A=E.parent().attr("id"),F=jQuery.makeArray(C);B[A]=F;E.parents(".peek").trigger(s,B)})}return y}function j(y,z){var w=[];for(var x=0;x<y;x+=1){w.push(z.multiselect?m(z,x):h(z,x))}return w}function r(y,z,x){var A=$("<tr/>").attr("id",z.id).addClass(v);if(x){var w=$("<td/>").addClass(f).text(z.label+":");A.append(w)}A.append(j(y,z));return A}function b(E){E=jQuery.extend(true,{},g,E);var D=$(this).addClass(l),A=D.find("table"),z=A.find("th").size(),C=A.find("tr").size(),w=A.find("td[colspan]").map(function(H,F){var G=$(this);if(G.text()&&G.text().match(new RegExp("^"+E.commentChar))){return $(this).css("color","grey").parent().get(0)}return null});if(E.hideCommentRows){w.hide();C-=w.size()}if(E.includePrompts){var y=$("<th/>").addClass("top-left").text(E.topLeftContent).attr("rowspan",C);A.find("tr").first().prepend(y)}var B=A.find("th:not(.top-left)").each(function(G,I){var H=$(this),J=H.text().replace(/^\d+\.*/,""),F=E.columnNames[G]||J;H.attr("data-"+a,F).text((G+1)+((F)?("."+F):("")))});if(E.renameColumns){B.addClass(q).click(function x(){var G=$(this),F=G.index()+(E.includePrompts?0:1),I=G.data(a),H=prompt("New column name:",I);if(H!==null&&H!==I){G.text(F+(H?("."+H):"")).data(a,H).attr("data-",a,H);var J=jQuery.makeArray(G.parent().children("th:not(.top-left)").map(function(){return $(this).data(a)}));G.parents(".peek").trigger(t,J)}})}E.controls.forEach(function(G,F){i(G);var H=r(z,G,E.includePrompts);A.find("tbody").append(H)});return this}jQuery.fn.extend({peekControl:function d(w){return this.map(function(){return b.call(this,w)})}})}());