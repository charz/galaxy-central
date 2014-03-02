define(["galaxy.masthead","utils/utils","libs/toastr","mvc/library/library-model"],function(a,c,e,b){var d=Backbone.View.extend({el:"#libraries_element",events:{"click .edit_library_btn":"edit_button_event","click .save_library_btn":"save_library_modification","click .cancel_library_btn":"cancel_library_modification","click .delete_library_btn":"delete_library","click .undelete_library_btn":"undelete_library"},modal:null,collection:null,initialize:function(){var f=this;this.collection=new b.Libraries();this.collection.fetch({success:function(g){f.render();$("#center [data-toggle]").tooltip();$("#center").css("overflow","auto")},error:function(h,g){e.error("An error occured. Please try again.")}})},render:function(g){var h=this.templateLibraryList();var i=null;var f=false;var j=null;if(typeof g!=="undefined"){f=typeof g.with_deleted!=="undefined"?g.with_deleted:false;j=typeof g.models!=="undefined"?g.models:null}if(this.collection!==null&&j===null){if(f){i=this.collection.models}else{i=this.collection.where({deleted:false})}}else{if(j!==null){i=j}else{i=[]}}this.$el.html(h({libraries:i,order:this.collection.sort_order}))},sortLibraries:function(g,f){if(g==="name"){if(f==="asc"){this.collection.sort_order="asc";this.collection.comparator=function(i,h){if(i.get("name").toLowerCase()>h.get("name").toLowerCase()){return 1}if(h.get("name").toLowerCase()>i.get("name").toLowerCase()){return -1}return 0}}else{if(f==="desc"){this.collection.sort_order="desc";this.collection.comparator=function(i,h){if(i.get("name").toLowerCase()>h.get("name").toLowerCase()){return -1}if(h.get("name").toLowerCase()>i.get("name").toLowerCase()){return 1}return 0}}}this.collection.sort()}},templateLibraryList:function(){tmpl_array=[];tmpl_array.push('<div class="library_container table-responsive">');tmpl_array.push("<% if(libraries.length === 0) { %>");tmpl_array.push("<div>I see no libraries. Why don't you create one?</div>");tmpl_array.push("<% } else{ %>");tmpl_array.push('<table class="grid table table-condensed">');tmpl_array.push("   <thead>");tmpl_array.push('     <th style="width:30%;"><a title="Click to reverse order" href="#sort/name/<% if(order==="desc"||order===null){print("asc")}else{print("desc")} %>">name</a> <span title="Sorted alphabetically" class="fa fa-sort-alpha-<%- order %>"></span></th>');tmpl_array.push('     <th style="width:22%;">description</th>');tmpl_array.push('     <th style="width:22%;">synopsis</th> ');tmpl_array.push('     <th style="width:26%;"></th> ');tmpl_array.push("   </thead>");tmpl_array.push("   <tbody>");tmpl_array.push("       <% _.each(libraries, function(library) { %>");tmpl_array.push('           <tr class="<% if(library.get("deleted") === true){print("active");}%>" data-id="<%- library.get("id") %>">');tmpl_array.push('               <td><span data-toggle="tooltip" data-placement="top" title="Item is public" class="fa fa-globe fa-lg"></span> <a href="#folders/<%- library.get("root_folder_id") %>"><%- library.get("name") %></a></td>');tmpl_array.push('               <td><%= _.escape(library.get("description")) %></td>');tmpl_array.push('               <td><%= _.escape(library.get("synopsis")) %></td>');tmpl_array.push('               <td class="right-center">');tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Modify library" class="primary-button btn-xs edit_library_btn" type="button"><span class="fa fa-pencil"></span></button>');tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Save changes" class="primary-button btn-xs save_library_btn" type="button" style="display:none;"><span class="fa fa-floppy-o"> Save</span></button>');tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Discard changes" class="primary-button btn-xs cancel_library_btn" type="button" style="display:none;"><span class="fa fa-times"> Cancel</span></button>');tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Delete library (can be undeleted later)" class="primary-button btn-xs delete_library_btn" type="button" style="display:none;"><span class="fa fa-trash-o"> Delete</span></button>');tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Undelete library" class="primary-button btn-xs undelete_library_btn" type="button" style="display:none;"><span class="fa fa-unlock"> Undelete</span></button>');tmpl_array.push("               </td>");tmpl_array.push("           </tr>");tmpl_array.push("       <% }); %>");tmpl_array.push("   </tbody>");tmpl_array.push("</table>");tmpl_array.push("<% }%>");tmpl_array.push("</div>");return _.template(tmpl_array.join(""))},templateNewLibraryInModal:function(){tmpl_array=[];tmpl_array.push('<div id="new_library_modal">');tmpl_array.push("   <form>");tmpl_array.push('       <input type="text" name="Name" value="" placeholder="Name">');tmpl_array.push('       <input type="text" name="Description" value="" placeholder="Description">');tmpl_array.push('       <input type="text" name="Synopsis" value="" placeholder="Synopsis">');tmpl_array.push("   </form>");tmpl_array.push("</div>");return tmpl_array.join("")},save_library_modification:function(i){var h=$(i.target).closest("tr");var f=this.collection.get(h.data("id"));var g=false;var k=h.find(".input_library_name").val();if(typeof k!=="undefined"&&k!==f.get("name")){if(k.length>2){f.set("name",k);g=true}else{e.warning("Library name has to be at least 3 characters long");return}}var j=h.find(".input_library_description").val();if(typeof j!=="undefined"&&j!==f.get("description")){f.set("description",j);g=true}var l=h.find(".input_library_synopsis").val();if(typeof l!=="undefined"&&l!==f.get("synopsis")){f.set("synopsis",l);g=true}if(g){f.save(null,{patch:true,success:function(m){e.success("Changes to library saved");galaxyLibraryview.toggle_library_modification(h)},error:function(n,m){e.error("An error occured during updating the library :(")}})}},edit_button_event:function(f){this.toggle_library_modification($(f.target).closest("tr"))},toggle_library_modification:function(i){var f=this.collection.get(i.data("id"));i.find(".edit_library_btn").toggle();i.find(".save_library_btn").toggle();i.find(".cancel_library_btn").toggle();if(f.get("deleted")){i.find(".undelete_library_btn").toggle()}else{i.find(".delete_library_btn").toggle()}if(i.find(".edit_library_btn").is(":hidden")){var g=f.get("name");var k='<input type="text" class="form-control input_library_name" placeholder="name">';i.children("td").eq(0).html(k);if(typeof g!==undefined){i.find(".input_library_name").val(g)}var h=f.get("description");var k='<input type="text" class="form-control input_library_description" placeholder="description">';i.children("td").eq(1).html(k);if(typeof h!==undefined){i.find(".input_library_description").val(h)}var j=f.get("synopsis");var k='<input type="text" class="form-control input_library_synopsis" placeholder="synopsis">';i.children("td").eq(2).html(k);if(typeof j!==undefined){i.find(".input_library_synopsis").val(j)}}else{i.children("td").eq(0).html(f.get("name"));i.children("td").eq(1).html(f.get("description"));i.children("td").eq(2).html(f.get("synopsis"))}},cancel_library_modification:function(h){var g=$(h.target).closest("tr");var f=this.collection.get(g.data("id"));this.toggle_library_modification(g);g.children("td").eq(0).html(f.get("name"));g.children("td").eq(1).html(f.get("description"));g.children("td").eq(2).html(f.get("synopsis"))},undelete_library:function(h){var g=$(h.target).closest("tr");var f=this.collection.get(g.data("id"));this.toggle_library_modification(g);f.url=f.urlRoot+f.id+"?undelete=true";f.destroy({success:function(i){i.set("deleted",false);galaxyLibraryview.collection.add(i);g.removeClass("active");e.success("Library has been undeleted")},error:function(){e.error("An error occured while undeleting the library :(")}})},delete_library:function(h){var g=$(h.target).closest("tr");var f=this.collection.get(g.data("id"));this.toggle_library_modification(g);f.destroy({success:function(i){g.remove();i.set("deleted",true);galaxyLibraryview.collection.add(i);e.success("Library has been marked deleted")},error:function(){e.error("An error occured during deleting the library :(")}})},redirectToHome:function(){window.location="../"},redirectToLogin:function(){window.location="/user/login"},show_library_modal:function(g){g.preventDefault();g.stopPropagation();var f=this;this.modal=Galaxy.modal;this.modal.show({closing_events:true,title:"Create New Library",body:this.templateNewLibraryInModal(),buttons:{Create:function(){f.create_new_library_event()},Close:function(){f.modal.hide()}}})},create_new_library_event:function(){var h=this.serialize_new_library();if(this.validate_new_library(h)){var g=new b.Library();var f=this;g.save(h,{success:function(i){f.collection.add(i);f.modal.hide();f.clear_library_modal();f.render();e.success("Library created")},error:function(){e.error("An error occured :(")}})}else{e.error("Library's name is missing")}return false},clear_library_modal:function(){$("input[name='Name']").val("");$("input[name='Description']").val("");$("input[name='Synopsis']").val("")},serialize_new_library:function(){return{name:$("input[name='Name']").val(),description:$("input[name='Description']").val(),synopsis:$("input[name='Synopsis']").val()}},validate_new_library:function(f){return f.name!==""}});return{GalaxyLibraryview:d}});