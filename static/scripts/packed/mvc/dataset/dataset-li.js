define(["mvc/list/list-item","mvc/dataset/states","jq-plugins/ui/fa-icon-button","mvc/base-mvc","utils/localization"],function(d,a,e,b,c){var g=d.ListItemView;var f=g.extend({className:g.prototype.className+" dataset",id:function(){return["dataset",this.model.get("id")].join("-")},initialize:function(h){if(h.logger){this.logger=this.model.logger=h.logger}this.log(this+".initialize:",h);g.prototype.initialize.call(this,h);this.linkTarget=h.linkTarget||"_blank";this._setUpListeners()},_setUpListeners:function(){g.prototype._setUpListeners.call(this);this.model.on("change",function(i,h){if(this.model.changedAttributes().state&&this.model.inReadyState()&&this.expanded&&!this.model.hasDetails()){this.model.fetch()}else{this.render()}},this)},_fetchModelDetails:function(){var h=this;if(h.model.inReadyState()&&!h.model.hasDetails()){return h.model.fetch({silent:true})}return jQuery.when()},remove:function(i,j){var h=this;i=i||this.fxSpeed;this.$el.fadeOut(i,function(){Backbone.View.prototype.remove.call(h);if(j){j.call(h)}})},render:function(h){return g.prototype.render.call(this,h)},_swapNewRender:function(h){g.prototype._swapNewRender.call(this,h);if(this.model.has("state")){this.$el.addClass("state-"+this.model.get("state"))}return this.$el},_renderPrimaryActions:function(){return[this._renderDisplayButton()]},_renderDisplayButton:function(){var j=this.model.get("state");if((j===a.NOT_VIEWABLE)||(j===a.DISCARDED)||(!this.model.get("accessible"))){return null}var i={target:this.linkTarget,classes:"display-btn"};if(this.model.get("purged")){i.disabled=true;i.title=c("Cannot display datasets removed from disk")}else{if(j===a.UPLOAD){i.disabled=true;i.title=c("This dataset must finish uploading before it can be viewed")}else{if(j===a.NEW){i.disabled=true;i.title=c("This dataset is not yet viewable")}else{i.title=c("View data");i.href=this.model.urls.display;var h=this;i.onclick=function(k){if(Galaxy.frame&&Galaxy.frame.active){Galaxy.frame.add_dataset(h.model.get("id"));k.preventDefault()}}}}}i.faIcon="fa-eye";return e(i)},_renderDetails:function(){if(this.model.get("state")===a.NOT_VIEWABLE){return $(this.templates.noAccess(this.model.toJSON(),this))}var h=g.prototype._renderDetails.call(this);h.find(".actions .left").empty().append(this._renderSecondaryActions());h.find(".summary").html(this._renderSummary()).prepend(this._renderDetailMessages());h.find(".display-applications").html(this._renderDisplayApplications());this._setUpBehaviors(h);return h},_renderSummary:function(){var h=this.model.toJSON(),i=this.templates.summaries[h.state];i=i||this.templates.summaries.unknown;return i(h,this)},_renderDetailMessages:function(){var h=this,j=$('<div class="detail-messages"></div>'),i=h.model.toJSON();_.each(h.templates.detailMessages,function(k){j.append($(k(i,h)))});return j},_renderDisplayApplications:function(){if(this.model.isDeletedOrPurged()){return""}return[this.templates.displayApplications(this.model.get("display_apps"),this),this.templates.displayApplications(this.model.get("display_types"),this)].join("")},_renderSecondaryActions:function(){this.debug("_renderSecondaryActions");switch(this.model.get("state")){case a.NOT_VIEWABLE:return[];case a.OK:case a.FAILED_METADATA:case a.ERROR:return[this._renderDownloadButton(),this._renderShowParamsButton()]}return[this._renderShowParamsButton()]},_renderShowParamsButton:function(){return e({title:c("View details"),classes:"params-btn",href:this.model.urls.show_params,target:this.linkTarget,faIcon:"fa-info-circle"})},_renderDownloadButton:function(){if(this.model.get("purged")||!this.model.hasData()){return null}if(!_.isEmpty(this.model.get("meta_files"))){return this._renderMetaFileDownloadButton()}return $(['<a class="download-btn icon-btn" href="',this.model.urls.download,'" title="'+c("Download")+'">','<span class="fa fa-floppy-o"></span>',"</a>"].join(""))},_renderMetaFileDownloadButton:function(){var h=this.model.urls;return $(['<div class="metafile-dropdown dropdown">','<a class="download-btn icon-btn" href="javascript:void(0)" data-toggle="dropdown"',' title="'+c("Download")+'">','<span class="fa fa-floppy-o"></span>',"</a>",'<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">','<li><a href="'+h.download+'">',c("Download dataset"),"</a></li>",_.map(this.model.get("meta_files"),function(i){return['<li><a href="',h.meta_download+i.file_type,'">',c("Download")," ",i.file_type,"</a></li>"].join("")}).join("\n"),"</ul>","</div>"].join("\n"))},events:_.extend(_.clone(g.prototype.events),{"click .display-btn":function(h){this.trigger("display",this,h)},"click .params-btn":function(h){this.trigger("params",this,h)},"click .download-btn":function(h){this.trigger("download",this,h)}}),toString:function(){var h=(this.model)?(this.model+""):("(no model)");return"DatasetListItemView("+h+")"}});f.prototype.templates=(function(){var j=_.extend({},g.prototype.templates.warnings,{failed_metadata:b.wrapTemplate(['<% if( model.state === "failed_metadata" ){ %>','<div class="warningmessagesmall">',c("An error occurred setting the metadata for this dataset"),"</div>","<% } %>"]),error:b.wrapTemplate(["<% if( model.error ){ %>",'<div class="errormessagesmall">',c("There was an error getting the data for this dataset"),": <%- model.error %>","</div>","<% } %>"]),purged:b.wrapTemplate(["<% if( model.purged ){ %>",'<div class="purged-msg warningmessagesmall">',c("This dataset has been deleted and removed from disk"),"</div>","<% } %>"]),deleted:b.wrapTemplate(["<% if( model.deleted && !model.purged ){ %>",'<div class="deleted-msg warningmessagesmall">',c("This dataset has been deleted"),"</div>","<% } %>"])});var k=b.wrapTemplate(['<div class="details">','<div class="summary"></div>','<div class="actions clear">','<div class="left"></div>','<div class="right"></div>',"</div>","<% if( !dataset.deleted && !dataset.purged ){ %>",'<div class="tags-display"></div>','<div class="annotation-display"></div>','<div class="display-applications"></div>',"<% if( dataset.peek ){ %>",'<pre class="dataset-peek"><%= dataset.peek %></pre>',"<% } %>","<% } %>","</div>"],"dataset");var i=b.wrapTemplate(['<div class="details">','<div class="summary">',c("You do not have permission to view this dataset"),"</div>","</div>"],"dataset");var l={};l[a.OK]=l[a.FAILED_METADATA]=b.wrapTemplate(["<% if( dataset.misc_blurb ){ %>",'<div class="blurb">','<span class="value"><%- dataset.misc_blurb %></span>',"</div>","<% } %>","<% if( dataset.file_ext ){ %>",'<div class="datatype">','<label class="prompt">',c("format"),"</label>",'<span class="value"><%- dataset.file_ext %></span>',"</div>","<% } %>","<% if( dataset.metadata_dbkey ){ %>",'<div class="dbkey">','<label class="prompt">',c("database"),"</label>",'<span class="value">',"<%- dataset.metadata_dbkey %>","</span>","</div>","<% } %>","<% if( dataset.misc_info ){ %>",'<div class="info">','<span class="value"><%- dataset.misc_info %></span>',"</div>","<% } %>"],"dataset");l[a.NEW]=b.wrapTemplate(["<div>",c("This is a new dataset and not all of its data are available yet"),"</div>"],"dataset");l[a.NOT_VIEWABLE]=b.wrapTemplate(["<div>",c("You do not have permission to view this dataset"),"</div>"],"dataset");l[a.DISCARDED]=b.wrapTemplate(["<div>",c("The job creating this dataset was cancelled before completion"),"</div>"],"dataset");l[a.QUEUED]=b.wrapTemplate(["<div>",c("This job is waiting to run"),"</div>"],"dataset");l[a.RUNNING]=b.wrapTemplate(["<div>",c("This job is currently running"),"</div>"],"dataset");l[a.UPLOAD]=b.wrapTemplate(["<div>",c("This dataset is currently uploading"),"</div>"],"dataset");l[a.SETTING_METADATA]=b.wrapTemplate(["<div>",c("Metadata is being auto-detected"),"</div>"],"dataset");l[a.PAUSED]=b.wrapTemplate(["<div>",c('This job is paused. Use the "Resume Paused Jobs" in the history menu to resume'),"</div>"],"dataset");l[a.ERROR]=b.wrapTemplate(["<% if( !dataset.purged ){ %>","<div><%- dataset.misc_blurb %></div>","<% } %>",'<span class="help-text">',c("An error occurred with this dataset"),":</span>",'<div class="job-error-text"><%- dataset.misc_info %></div>'],"dataset");l[a.EMPTY]=b.wrapTemplate(["<div>",c("No data"),": <i><%- dataset.misc_blurb %></i></div>"],"dataset");l.unknown=b.wrapTemplate(['<div>Error: unknown dataset state: "<%- dataset.state %>"</div>'],"dataset");var m={resubmitted:b.wrapTemplate(["<% if( model.resubmitted ){ %>",'<div class="resubmitted-msg infomessagesmall">',c("The job creating this dataset has been resubmitted"),"</div>","<% } %>"])};var h=b.wrapTemplate(["<% _.each( apps, function( app ){ %>",'<div class="display-application">','<span class="display-application-location"><%- app.label %></span> ','<span class="display-application-links">',"<% _.each( app.links, function( link ){ %>",'<a target="<%= link.target %>" href="<%= link.href %>">',"<% print( _l( link.text ) ); %>","</a> ","<% }); %>","</span>","</div>","<% }); %>"],"apps");return _.extend({},g.prototype.templates,{warnings:j,details:k,noAccess:i,summaries:l,detailMessages:m,displayApplications:h})}());return{DatasetListItemView:f}});