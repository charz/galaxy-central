define([],function(){var e=Backbone.Model.extend({urlRoot:"/api/libraries/"});var a=Backbone.Model.extend({urlRoot:"/api/folders"});var h=Backbone.Collection.extend({url:"/api/libraries",model:e,sort_key:"name",sort_order:null});var f=Backbone.Model.extend({urlRoot:"/api/libraries/datasets"});var c=Backbone.Collection.extend({model:f});var d=Backbone.Model.extend({defaults:{folder:new c(),full_path:"unknown",urlRoot:"/api/folders/",id:"unknown"},parse:function(j){this.full_path=j[0].full_path;this.get("folder").reset(j[1].folder_contents);return j}});var b=Backbone.Model.extend({urlRoot:"/api/histories/"});var g=Backbone.Model.extend({url:"/api/histories/"});var i=Backbone.Collection.extend({url:"/api/histories",model:g});return{Library:e,FolderAsModel:a,Libraries:h,Item:f,Folder:c,FolderContainer:d,HistoryItem:b,GalaxyHistory:g,GalaxyHistories:i}});