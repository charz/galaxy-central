var UserQuotaMeter=BaseView.extend(LoggableMixin).extend({options:{warnAtPercent:85,errorAtPercent:100,meterDocument:window.top.document,containerSelector:".quota-meter-container",meterSelector:"#quota-meter",barSelector:"#quota-meter-bar",textSelector:"#quota-meter-text",msgDocument:(top.frames.galaxy_history)?(top.frames.galaxy_history.document):(top.document),msgSelector:"#quota-message-container",warnClass:"quota-meter-bar-warn",errorClass:"quota-meter-bar-error",usageTemplate:"Using <%= nice_total_disk_usage %>",quotaTemplate:"Using <%= quota_percent %>%",meterTemplate:"",animationSpeed:"fast"},initialize:function(a){this.log(this+".initialize:",a);_.extend(this.options,a);this.model.bind("change:quota_percent change:total_disk_usage",this.render,this)},update:function(a){this.log(this+" updating user data...",a);this.model.loadFromApi(this.model.get("id"),a);return this},isOverQuota:function(){return(this.model.get("quota_percent")!==null&&this.model.get("quota_percent")>=this.options.errorAtPercent)},_render_quota:function(){var a=this.model.toJSON(),b=a.quota_percent,c=$(UserQuotaMeter.templates.quota(a));if(this.isOverQuota()){c.addClass("progress-danger");c.find("#quota-meter-text").css("color","white");this.trigger("quota:over",a)}else{if(b>=this.options.warnAtPercent){c.addClass("progress-warning");this.trigger("quota:under quota:under:approaching",a)}else{c.addClass("progress-success");this.trigger("quota:under quota:under:ok",a)}}return c},_render_usage:function(){var a=$(UserQuotaMeter.templates.usage(this.model.toJSON()));this.log(this+".rendering usage:",a);return a},render:function(){var a=null;this.log(this+".model.quota_percent:",this.model.get("quota_percent"));if((this.model.get("quota_percent")===null)||(this.model.get("quota_percent")===undefined)){a=this._render_usage()}else{a=this._render_quota()}this.$el.html(a);return this},toString:function(){return"UserQuotaMeter("+this.model+")"}});UserQuotaMeter.templates={quota:Handlebars.templates["template-user-quotaMeter-quota"],usage:Handlebars.templates["template-user-quotaMeter-usage"]};