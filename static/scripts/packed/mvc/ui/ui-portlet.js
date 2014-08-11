define(["utils/utils"],function(a){var b=Backbone.View.extend({visible:false,optionsDefault:{title:"",icon:"",buttons:null,body:null,scrollable:true,nopadding:false,operations:null,placement:"bottom"},$title:null,$content:null,$buttons:null,$operations:null,initialize:function(e){this.options=a.merge(e,this.optionsDefault);this.setElement(this._template(this.options));this.$content=this.$el.find("#content");this.$title=this.$el.find("#portlet-header-text");var d=this.$el.find("#portlet-content");if(!this.options.scrollable){if(this.options.title){d.addClass("no-scroll")}else{d.addClass("no-scroll-no-title")}}else{d.addClass("scroll")}if(this.options.nopadding){d.css("padding","0px");this.$content.css("padding","0px")}this.$buttons=$(this.el).find("#buttons");if(this.options.buttons){var c=this;$.each(this.options.buttons,function(f,g){g.$el.prop("id",f);c.$buttons.append(g.$el)})}else{this.$buttons.remove()}this.$operations=$(this.el).find("#operations");if(this.options.operations){var c=this;$.each(this.options.operations,function(f,g){g.$el.prop("id",f);c.$operations.append(g.$el)})}if(this.options.body){this.append(this.options.body)}},append:function(c){this.$content.append(a.wrap(c))},content:function(){return this.$content},show:function(){this.$el.fadeIn("fast");this.visible=true},hide:function(){this.$el.fadeOut("fast");this.visible=false},enableButton:function(c){this.$buttons.find("#"+c).prop("disabled",false)},disableButton:function(c){this.$buttons.find("#"+c).prop("disabled",true)},hideOperation:function(c){this.$operations.find("#"+c).hide()},showOperation:function(c){this.$operations.find("#"+c).show()},setOperation:function(e,d){var c=this.$operations.find("#"+e);c.off("click");c.on("click",d)},title:function(d){var c=this.$title;if(d){c.html(d)}return c.html()},_template:function(d){var c='<div class="ui-portlet">';if(d.title){c+='<div id="portlet-header" class="portlet-header"><div id="operations" style="float: right;"></div><h3>';if(d.icon){c+='<i class="icon fa '+d.icon+'">&nbsp;</i>'}c+='<span id="portlet-header-text">'+d.title+"</span></h3></div>"}c+='<div id="portlet-content" class="portlet-content">';if(d.placement=="top"){c+='<div id="buttons" class="buttons"></div>'}c+='<div id="content" class="content"></div>';if(d.placement=="bottom"){c+='<div id="buttons" class="buttons"></div>'}c+="</div></div>";return c}});return{View:b}});