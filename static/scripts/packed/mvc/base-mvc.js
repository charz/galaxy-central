var BaseModel=Backbone.RelationalModel.extend({defaults:{name:null,hidden:false},show:function(){this.set("hidden",false)},hide:function(){this.set("hidden",true)},is_visible:function(){return !this.attributes.hidden}});var BaseView=Backbone.View.extend({initialize:function(){this.model.on("change:hidden",this.update_visible,this);this.update_visible()},update_visible:function(){if(this.model.attributes.hidden){this.$el.hide()}else{this.$el.show()}}});var LoggableMixin={logger:null,log:function(){if(this.logger){return this.logger.log.apply(this.logger,arguments)}return undefined}};var GalaxyLocalization=jQuery.extend({},{ALIAS_NAME:"_l",localizedStrings:{},setLocalizedString:function(b,a){var c=this;var d=function(f,e){if(f!==e){c.localizedStrings[f]=e}};if(jQuery.type(b)==="string"){d(b,a)}else{if(jQuery.type(b)==="object"){jQuery.each(b,function(e,f){d(e,f)})}else{throw ("Localization.setLocalizedString needs either a string or object as the first argument, given: "+b)}}},localize:function(a){return this.localizedStrings[a]||a},toString:function(){return"GalaxyLocalization"}});window[GalaxyLocalization.ALIAS_NAME]=function(a){return GalaxyLocalization.localize(a)};var PersistantStorage=function(g,d){if(!g){throw ("PersistantStorage needs storageKey argument")}d=d||{};var b=jQuery.jStorage.get,c=jQuery.jStorage.set,a=jQuery.jStorage.deleteKey;function e(i,h){i=i||{};h=h||null;return{get:function(j){if(j===undefined){return i}else{if(i.hasOwnProperty(j)){return(jQuery.type(i[j])==="object")?(new e(i[j],this)):(i[j])}}return undefined},set:function(j,k){i[j]=k;this._save();return this},deleteKey:function(j){delete i[j];this._save();return this},_save:function(){return h._save()},toString:function(){return("StorageRecursionHelper("+i+")")}}}var f={};data=b(g);if(data===null){data=jQuery.extend(true,{},d);c(g,data)}f=new e(data);jQuery.extend(f,{_save:function(h){return c(g,f.get())},destroy:function(){return a(g)},toString:function(){return"PersistantStorage("+data+")"}});return f};