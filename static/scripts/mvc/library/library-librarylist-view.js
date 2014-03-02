// dependencies
define([
    "galaxy.masthead", 
    "utils/utils",
    "libs/toastr",
    "mvc/library/library-model"], 
function(mod_masthead, 
         mod_utils, 
         mod_toastr,
         mod_library_model) {

// galaxy library view
var GalaxyLibraryview = Backbone.View.extend({
    el: '#libraries_element',

    events: {
        'click .edit_library_btn'   : 'edit_button_event',
        'click .save_library_btn'   : 'save_library_modification',
        'click .cancel_library_btn' : 'cancel_library_modification',
        'click .delete_library_btn' : 'delete_library',
        'click .undelete_library_btn' : 'undelete_library'
    },

    modal: null,

    collection: null,

    // initialize
    initialize : function(){
        var viewContext = this;
        this.collection = new mod_library_model.Libraries();

        this.collection.fetch({
          success: function(libraries){
            viewContext.render();
            // initialize the library tooltips
            $("#center [data-toggle]").tooltip();
            // modification of upper DOM element to show scrollbars due to the #center element inheritance
            $("#center").css('overflow','auto');
          },
          error: function(model, response){
            mod_toastr.error('An error occured. Please try again.');
          }
        })
    },

    /** Renders the libraries table either from the object's own collection, 
     or from a given array of library models,
     or renders an empty list in case no data is given. */
    render: function (options) {
        var template = this.templateLibraryList();
        var libraries_to_render = null;
        var include_deleted = false;
        var models = null
        if (typeof options !== 'undefined'){
            include_deleted = typeof options.with_deleted !== 'undefined' ? options.with_deleted : false;
            models = typeof options.models !== 'undefined' ? options.models : null;
        }

        if (this.collection !== null && models === null){
            if (include_deleted){ // show all the libraries
              libraries_to_render = this.collection.models;
            } else{ // show only undeleted libraries
              libraries_to_render = this.collection.where({deleted: false});;
            }
        } else if (models !== null){
            libraries_to_render = models;
        } else {
            libraries_to_render = [];
            }

        this.$el.html(template({libraries: libraries_to_render, order: this.collection.sort_order}));
    },

    /** Sorts the underlying collection according to the parameters received through URL. 
        Currently supports only sorting by name. */
    sortLibraries: function(sort_by, order){
        if (sort_by === 'name'){
            if (order === 'asc'){
                this.collection.sort_order = 'asc';
                this.collection.comparator = function(libraryA, libraryB){
                      if (libraryA.get('name').toLowerCase() > libraryB.get('name').toLowerCase()) return 1; // after
                      if (libraryB.get('name').toLowerCase() > libraryA.get('name').toLowerCase()) return -1; // before
                      return 0; // equal
                }
            } else if (order === 'desc'){
                this.collection.sort_order = 'desc';
                this.collection.comparator = function(libraryA, libraryB){
                      if (libraryA.get('name').toLowerCase() > libraryB.get('name').toLowerCase()) return -1; // before
                      if (libraryB.get('name').toLowerCase() > libraryA.get('name').toLowerCase()) return 1; // after
                      return 0; // equal
                }
            }
            this.collection.sort();
        }

    },

// MMMMMMMMMMMMMMMMMM
// === TEMPLATES ====
// MMMMMMMMMMMMMMMMMM

    templateLibraryList: function(){
        tmpl_array = [];

        tmpl_array.push('<div class="library_container table-responsive">');
        tmpl_array.push('<% if(libraries.length === 0) { %>');
        tmpl_array.push("<div>I see no libraries. Why don't you create one?</div>");
        tmpl_array.push('<% } else{ %>');
        tmpl_array.push('<table class="grid table table-condensed">');
        tmpl_array.push('   <thead>');
        tmpl_array.push('     <th style="width:30%;"><a title="Click to reverse order" href="#sort/name/<% if(order==="desc"||order===null){print("asc")}else{print("desc")} %>">name</a> <span title="Sorted alphabetically" class="fa fa-sort-alpha-<%- order %>"></span></th>');
        tmpl_array.push('     <th style="width:22%;">description</th>');
        tmpl_array.push('     <th style="width:22%;">synopsis</th> ');
        tmpl_array.push('     <th style="width:26%;"></th> ');
        tmpl_array.push('   </thead>');
        tmpl_array.push('   <tbody>');
        tmpl_array.push('       <% _.each(libraries, function(library) { %>');
        tmpl_array.push('           <tr class="<% if(library.get("deleted") === true){print("active");}%>" data-id="<%- library.get("id") %>">');
        tmpl_array.push('               <td><span data-toggle="tooltip" data-placement="top" title="Item is public" class="fa fa-globe fa-lg"></span> <a href="#folders/<%- library.get("root_folder_id") %>"><%- library.get("name") %></a></td>');
        tmpl_array.push('               <td><%= _.escape(library.get("description")) %></td>');
        tmpl_array.push('               <td><%= _.escape(library.get("synopsis")) %></td>');
        tmpl_array.push('               <td class="right-center">');
        tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Modify library" class="primary-button btn-xs edit_library_btn" type="button"><span class="fa fa-pencil"></span></button>');
        tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Save changes" class="primary-button btn-xs save_library_btn" type="button" style="display:none;"><span class="fa fa-floppy-o"> Save</span></button>');
        tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Discard changes" class="primary-button btn-xs cancel_library_btn" type="button" style="display:none;"><span class="fa fa-times"> Cancel</span></button>');
        tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Delete library (can be undeleted later)" class="primary-button btn-xs delete_library_btn" type="button" style="display:none;"><span class="fa fa-trash-o"> Delete</span></button>');
        tmpl_array.push('                   <button data-toggle="tooltip" data-placement="top" title="Undelete library" class="primary-button btn-xs undelete_library_btn" type="button" style="display:none;"><span class="fa fa-unlock"> Undelete</span></button>');
        tmpl_array.push('               </td>');
        tmpl_array.push('           </tr>');
        tmpl_array.push('       <% }); %>');
        tmpl_array.push('   </tbody>');
        tmpl_array.push('</table>');
        tmpl_array.push('<% }%>');
        tmpl_array.push('</div>');

        return _.template(tmpl_array.join(''));
    },

    
    templateNewLibraryInModal: function(){
        tmpl_array = [];

        tmpl_array.push('<div id="new_library_modal">');
        tmpl_array.push('   <form>');
        tmpl_array.push('       <input type="text" name="Name" value="" placeholder="Name">');
        tmpl_array.push('       <input type="text" name="Description" value="" placeholder="Description">');
        tmpl_array.push('       <input type="text" name="Synopsis" value="" placeholder="Synopsis">');
        tmpl_array.push('   </form>');
        tmpl_array.push('</div>');

        return tmpl_array.join('');
    },

    save_library_modification: function(event){
        var $library_row = $(event.target).closest('tr');
        var library = this.collection.get($library_row.data('id'));

        var is_changed = false;

        var new_name = $library_row.find('.input_library_name').val();
        if (typeof new_name !== 'undefined' && new_name !== library.get('name') ){
            if (new_name.length > 2){
                library.set("name", new_name);
                is_changed = true;
            } else{
                mod_toastr.warning('Library name has to be at least 3 characters long');
                return
            }
        }

        var new_description = $library_row.find('.input_library_description').val();
        if (typeof new_description !== 'undefined' && new_description !== library.get('description') ){
            library.set("description", new_description);
            is_changed = true;
        }

        var new_synopsis = $library_row.find('.input_library_synopsis').val();
        if (typeof new_synopsis !== 'undefined' && new_synopsis !== library.get('synopsis') ){
            library.set("synopsis", new_synopsis);
            is_changed = true;
        }

        if (is_changed){
            library.save(null, {
              patch: true,
              success: function(library) {
                mod_toastr.success('Changes to library saved');
                galaxyLibraryview.toggle_library_modification($library_row);
              },
              error: function(model, response){
                mod_toastr.error('An error occured during updating the library :(');
              }
            });
        }
    },

    edit_button_event: function(event){
      this.toggle_library_modification($(event.target).closest('tr'));
    },

    toggle_library_modification: function($library_row){
        var library = this.collection.get($library_row.data('id'));

        $library_row.find('.edit_library_btn').toggle();
        $library_row.find('.save_library_btn').toggle();
        $library_row.find('.cancel_library_btn').toggle();
        if (library.get('deleted')){
            $library_row.find('.undelete_library_btn').toggle();
        } else {
            $library_row.find('.delete_library_btn').toggle();
        }

        if ($library_row.find('.edit_library_btn').is(':hidden')){
            // library name
            var current_library_name = library.get('name');
            var new_html = '<input type="text" class="form-control input_library_name" placeholder="name">';
            $library_row.children('td').eq(0).html(new_html);
            if (typeof current_library_name !== undefined){
                $library_row.find('.input_library_name').val(current_library_name);
            }
            // library description
            var current_library_description = library.get('description');
            var new_html = '<input type="text" class="form-control input_library_description" placeholder="description">';
            $library_row.children('td').eq(1).html(new_html);
            if (typeof current_library_description !== undefined){
                $library_row.find('.input_library_description').val(current_library_description);
            }
            // library synopsis
            var current_library_synopsis = library.get('synopsis');
            var new_html = '<input type="text" class="form-control input_library_synopsis" placeholder="synopsis">';
            $library_row.children('td').eq(2).html(new_html);
            if (typeof current_library_synopsis !== undefined){
                $library_row.find('.input_library_synopsis').val(current_library_synopsis);
            }
        } else {
            // missing ICON + LINK....needs refactoring to separate view
            $library_row.children('td').eq(0).html(library.get('name'));
            $library_row.children('td').eq(1).html(library.get('description'));
            $library_row.children('td').eq(2).html(library.get('synopsis'));
        }
        
    },

    cancel_library_modification: function(event){
        var $library_row = $(event.target).closest('tr');
        var library = this.collection.get($library_row.data('id'));
        this.toggle_library_modification($library_row);

        $library_row.children('td').eq(0).html(library.get('name'));
        $library_row.children('td').eq(1).html(library.get('description'));
        $library_row.children('td').eq(2).html(library.get('synopsis'));
    },

    undelete_library: function(event){
        var $library_row = $(event.target).closest('tr');
        var library = this.collection.get($library_row.data('id'));
        this.toggle_library_modification($library_row);

        // mark the library undeleted
        library.url = library.urlRoot + library.id + '?undelete=true';
        library.destroy({
          success: function (library) {
            // add the newly undeleted library back to the collection
            // backbone does not accept changes through destroy, so update it too
            library.set('deleted', false);
            galaxyLibraryview.collection.add(library);
            $library_row.removeClass('active');
            mod_toastr.success('Library has been undeleted');
          },
          error: function(){
            mod_toastr.error('An error occured while undeleting the library :(');
          }
        });
    },

    delete_library: function(event){
        var $library_row = $(event.target).closest('tr');
        var library = this.collection.get($library_row.data('id'));
        this.toggle_library_modification($library_row);

        // mark the library deleted
        library.destroy({
          success: function (library) {
            // add the new deleted library back to the collection
            $library_row.remove();
            library.set('deleted', true);
            galaxyLibraryview.collection.add(library);
            mod_toastr.success('Library has been marked deleted');
          },
          error: function(){
            mod_toastr.error('An error occured during deleting the library :(');
          }
        });

    },

    redirectToHome: function(){
        window.location = '../';
    },    
    redirectToLogin: function(){
        window.location = '/user/login';
    },

    // show/hide create library modal
    show_library_modal : function (event){
        event.preventDefault();
        event.stopPropagation();

        // create modal
        var self = this;
        this.modal = Galaxy.modal;
        this.modal.show({
            closing_events  : true,
            title           : 'Create New Library',
            body            : this.templateNewLibraryInModal(),
            buttons         : {
                'Create'    : function() {self.create_new_library_event()},
                'Close'     : function() {self.modal.hide();}
            }
        });
    },

    // create the new library from modal
    create_new_library_event: function(){
        var libraryDetails = this.serialize_new_library();
        if (this.validate_new_library(libraryDetails)){
            var library = new mod_library_model.Library();
            var self = this;
            library.save(libraryDetails, {
              success: function (library) {
                self.collection.add(library);
                self.modal.hide();
                self.clear_library_modal();
                self.render();
                mod_toastr.success('Library created');
              },
              error: function(){
                mod_toastr.error('An error occured :(');
              }
            });
        } else {
            mod_toastr.error('Library\'s name is missing');
        }
        return false;
    },

    // clear the library modal once saved
    clear_library_modal : function(){
        $("input[name='Name']").val('');
        $("input[name='Description']").val('');
        $("input[name='Synopsis']").val('');
    },

    // serialize data from the form
    serialize_new_library : function(){
        return {
            name: $("input[name='Name']").val(),
            description: $("input[name='Description']").val(),
            synopsis: $("input[name='Synopsis']").val()
        };
    },

    // validate new library info
    validate_new_library: function(libraryDetails){
        return libraryDetails.name !== '';
    }
});

// return
return {
    GalaxyLibraryview: GalaxyLibraryview
};

});