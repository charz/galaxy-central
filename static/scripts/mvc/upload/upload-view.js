// dependencies
define(["utils/utils",
        "mvc/upload/upload-button",
        "mvc/upload/upload-model",
        "mvc/upload/upload-row",
        "mvc/upload/upload-ftp",
        "mvc/ui/ui-popover",
        "mvc/ui/ui-modal",
        "mvc/ui/ui-select",
        "utils/uploadbox"],

        function(   Utils,
                    UploadButton,
                    UploadModel,
                    UploadItem,
                    UploadFtp,
                    Popover,
                    Modal,
                    Select
                ) {

// galaxy upload
return Backbone.View.extend({
    // options
    options : {
        nginx_upload_path   : ''
    },

    // own modal
    modal : null,

    // button
    ui_button : null,

    // jquery uploadbox plugin
    uploadbox: null,

    // current history
    current_history: null,

    // extension selector
    select_extension : null,

    // genome selector
    select_genome: null,

    // current upload size
    upload_size: 0,

    // extension types
    list_extensions :[],

    // genomes
    list_genomes : [],

    // datatype placeholder for auto-detection
    auto: {
        id          : 'auto',
        text        : 'Auto-detect',
        description : 'This system will try to detect the file type automatically. If your file is not detected properly as one of the known formats, it most likely means that it has some format problems (e.g., different number of columns on different rows). You can still coerce the system to set your data to the format you think it should be.  You can also upload compressed files, which will automatically be decompressed.'
    },

    // collection
    collection : new UploadModel.Collection(),

    // ftp file viewer
    ftp : null,

    // counter
    counter : {
        // stats
        announce    : 0,
        success     : 0,
        error       : 0,
        running     : 0,

        // reset stats
        reset : function() {
            this.announce = this.success = this.error = this.running = 0;
        }
    },

    // initialize
    initialize : function(options) {
        // link this
        var self = this;

        // read in options
        if (options) {
            this.options = _.defaults(options, this.options);
        }

        // create model
        this.ui_button = new UploadButton.Model({
            icon        : 'fa-upload',
            tooltip     : 'Download from URL or upload files from disk',
            label       : 'Load Data',
            onclick     : function(e) {
                if (e) {
                    // prevent default
                    e.preventDefault();

                    // show
                    self.show()
                }
            },
            onunload    : function() {
                if (self.counter.running > 0) {
                    return "Several uploads are still processing.";
                }
            }
        });

        // define location
        $('.with-upload-button').append((new UploadButton.View(this.ui_button)).$el);

        // load extension
        var self = this;
        Utils.get({
            url     : galaxy_config.root + "api/datatypes?extension_only=False",
            success : function(datatypes) {
                for (key in datatypes) {
                    self.list_extensions.push({
                        id              : datatypes[key].extension,
                        text            : datatypes[key].extension,
                        description     : datatypes[key].description,
                        description_url : datatypes[key].description_url
                    });
                }

                // sort
                self.list_extensions.sort(function(a, b) {
                    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
                });

                // add auto field
                if (!self.options.datatypes_disable_auto) {
                    self.list_extensions.unshift(self.auto);
                }
            }
        });

        // load genomes
        Utils.get({
            url     : galaxy_config.root + "api/genomes",
            success : function(genomes) {
                for (key in genomes) {
                    self.list_genomes.push({
                        id      : genomes[key][1],
                        text    : genomes[key][0]
                    });
                }

                // sort
                self.list_genomes.sort(function(a, b) {
                    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
                });
            }
        });

        // events
        this.collection.on('remove', function(item) {
            self._eventRemove(item);
        });
    },

    //
    // event triggered by upload button
    //

    // show/hide upload frame
    show: function () {
        // wait for galaxy history panel
        var self = this;
        if (!Galaxy.currHistoryPanel || !Galaxy.currHistoryPanel.model) {
            window.setTimeout(function() { self.show() }, 500)
            return;
        }

        // create modal
        if (!this.modal) {
            // make modal
            var self = this;
            this.modal = new Modal.View({
                title   : 'Download data directly from web or upload files from your disk',
                body    : this._template('upload-box', 'upload-info'),
                buttons : {
                    'Choose local file' : function() {self.uploadbox.select()},
                    'Choose FTP file'   : function() {self._eventFtp()},
                    'Paste/Fetch data'  : function() {self._eventCreate()},
                    'Start'             : function() {self._eventStart()},
                    'Pause'             : function() {self._eventStop()},
                    'Reset'             : function() {self._eventReset()},
                    'Close'             : function() {self.modal.hide()},
                },
                height              : '400',
                width               : '900',
                closing_events      : true
            });

            // set element
            this.setElement('#upload-box');

            // file upload
            var self = this;
            this.uploadbox = this.$el.uploadbox({
                announce        : function(index, file, message) { self._eventAnnounce(index, file, message) },
                initialize      : function(index, file, message) { return self._eventInitialize(index, file, message) },
                progress        : function(index, file, message) { self._eventProgress(index, file, message) },
                success         : function(index, file, message) { self._eventSuccess(index, file, message) },
                error           : function(index, file, message) { self._eventError(index, file, message) },
                complete        : function() { self._eventComplete() }
            });

            // add ftp file viewer
            var button = this.modal.getButton('Choose FTP file');
            this.ftp = new Popover.View({
                title       : 'FTP files',
                container   : button
            });

            // select extension
            this.select_extension = new Select.View({
                css         : 'header-selection',
                data        : self.list_extensions,
                container   : self.$el.parent().find('#header-extension'),
                value       : self.list_extensions[0]
            });

            // handle extension info popover
            self.$el.parent().find('#header-extension-info').on('click' , function(e) {
                self.showExtensionInfo({
                    $el         : $(e.target),
                    title       : self.select_extension.text(),
                    extension   : self.select_extension.value()
                });
            }).on('mousedown', function(e) { e.preventDefault(); });
            
            // genome extension
            this.select_genome = new Select.View({
                css         : 'header-selection',
                data        : self.list_genomes,
                container   : self.$el.parent().find('#header-genome'),
                value       : self.list_genomes[0]
            });
        }

        // show modal
        this.modal.show();

        // refresh
        this._updateUser();

        // setup info
        this._updateScreen();
    },

    showExtensionInfo : function(options) {
        // initialize
        var self = this;
        var $el = options.$el;
        var extension = options.extension;
        var title = options.title;
        var description = _.findWhere(self.list_extensions, {'id': extension});

        // create popup
        this.extension_popup && this.extension_popup.remove();
        this.extension_popup = new Popover.View({
            placement: 'bottom',
            container: $el,
            destroy: true
        });
        
        // add content and show popup
        this.extension_popup.title(title);
        this.extension_popup.empty();
        this.extension_popup.append(this._templateDescription(description));
        this.extension_popup.show();
    },

    //
    // events triggered by collection
    //

    // remove item from upload list
    _eventRemove : function(item) {
        // update status
        var status = item.get('status');

        // reduce counter
        if (status == 'success') {
            this.counter.success--;
        } else if (status == 'error') {
            this.counter.error--;
        } else {
            this.counter.announce--;
        }

        // show on screen info
        this._updateScreen();

        // remove from queue
        this.uploadbox.remove(item.id);
    },

    //
    // events triggered by the upload box plugin
    //

    // a new file has been dropped/selected through the uploadbox plugin
    _eventAnnounce : function(index, file, message) {
        // update counter
        this.counter.announce++;

        // update screen
        this._updateScreen();

        // create view/model
        var upload_item = new UploadItem(this, {
            id          : index,
            file_name   : file.name,
            file_size   : file.size,
            file_mode   : file.mode,
            file_path   : file.path
        });

        // add to collection
        this.collection.add(upload_item.model);

        // add upload item element to table
        $(this.el).find('tbody:first').append(upload_item.$el);

        // render
        upload_item.render();
    },

    // the uploadbox plugin is initializing the upload for this file
    _eventInitialize : function(index, file, message) {
        // get element
        var it = this.collection.get(index);

        // update status
        it.set('status', 'running');

        // get configuration
        var file_name       = it.get('file_name');
        var file_path       = it.get('file_path');
        var file_mode       = it.get('file_mode');
        var extension       = it.get('extension');
        var genome          = it.get('genome');
        var url_paste       = it.get('url_paste');
        var space_to_tabs   = it.get('space_to_tabs');
        var to_posix_lines  = it.get('to_posix_lines');

        // validate
        if (!url_paste && !(file.size > 0))
            return null;

        // configure uploadbox
        this.uploadbox.configure({url : this.options.nginx_upload_path});

        // local files
        if (file_mode == 'local') {
            this.uploadbox.configure({paramname : 'files_0|file_data'});
        } else {
            this.uploadbox.configure({paramname : null});
        }

        // configure tool
        tool_input = {};

        // new files
        if (file_mode == 'new') {
            tool_input['files_0|url_paste'] = url_paste;
        }

        // files from ftp
        if (file_mode == 'ftp') {
            tool_input['files_0|ftp_files'] = file_path;
        }

        // add common configuration
        tool_input['dbkey'] = genome;
        tool_input['file_type'] = extension;
        tool_input['files_0|type'] = 'upload_dataset';
        tool_input['files_0|space_to_tab'] = space_to_tabs && 'Yes' || null;
        tool_input['files_0|to_posix_lines'] = to_posix_lines && 'Yes' || null;

        // setup data
        data = {};
        data['history_id'] = this.current_history;
        data['tool_id'] = 'upload1';
        data['inputs'] = JSON.stringify(tool_input);

        // return additional data to be send with file
        return data;
    },

    // progress
    _eventProgress : function(index, file, percentage) {
        // set progress for row
        var it = this.collection.get(index);
        it.set('percentage', percentage);

        // update ui button
        this.ui_button.set('percentage', this._upload_percentage(percentage, file.size));
    },

    // success
    _eventSuccess : function(index, file, message) {
        // update status
        var it = this.collection.get(index);
        it.set('percentage', 100);
        it.set('status', 'success');

        // file size
        var file_size = it.get('file_size');

        // update ui button
        this.ui_button.set('percentage', this._upload_percentage(100, file_size));

        // update completed
        this.upload_completed += file_size * 100;

        // update counter
        this.counter.announce--;
        this.counter.success++;

        // update on screen info
        this._updateScreen();

        // update galaxy history
        Galaxy.currHistoryPanel.refreshContents();
    },

    // error
    _eventError : function(index, file, message) {
        // get element
        var it = this.collection.get(index);

        // update status
        it.set('percentage', 100);
        it.set('status', 'error');
        it.set('info', message);

        // update ui button
        this.ui_button.set('percentage', this._upload_percentage(100, file.size));
        this.ui_button.set('status', 'danger');

        // update completed
        this.upload_completed += file.size * 100;

        // update counter
        this.counter.announce--;
        this.counter.error++;

        // update on screen info
        this._updateScreen();
    },

    // queue is done
    _eventComplete: function() {
        // reset queued upload to initial status
        this.collection.each(function(item) {
            if(item.get('status') == 'queued') {
                item.set('status', 'init');
            }
        });

        // update running
        this.counter.running = 0;
        this._updateScreen();
    },

    //
    // events triggered by this view
    //

    _eventFtp: function() {
        // check if popover is visible
        if (!this.ftp.visible) {
            // show popover
            this.ftp.empty();
            this.ftp.append((new UploadFtp(this)).$el);
            this.ftp.show();
        } else {
            // hide popover
            this.ftp.hide();
        }
    },

    // create a new file
    _eventCreate : function (){
        this.uploadbox.add([{
            name    : 'New File',
            size    : 0,
            mode    : 'new'
        }]);
    },

    // start upload process
    _eventStart : function() {
        // check
        if (this.counter.announce == 0 || this.counter.running > 0) {
            return;
        }

        // reset current size
        var self = this;
        this.upload_size = 0;
        this.upload_completed = 0;
        // switch icons for new uploads
        this.collection.each(function(item) {
            if(item.get('status') == 'init') {
                item.set('status', 'queued');
                self.upload_size += item.get('file_size');
            }
        });

        // reset progress
        this.ui_button.set('percentage', 0);
        this.ui_button.set('status', 'success');

        // update running
        this.counter.running = this.counter.announce;
        this._updateScreen();

        // initiate upload procedure in plugin
        this.uploadbox.start();
    },

    // pause upload process
    _eventStop : function() {
        // check
        if (this.counter.running == 0) {
            return;
        }

        // show upload has paused
        this.ui_button.set('status', 'info');

        // request pause
        this.uploadbox.stop();

        // set html content
        $('#upload-info').html('Queue will pause after completing the current file...');
    },

    // remove all
    _eventReset : function() {
        // make sure queue is not running
        if (this.counter.running == 0){
            // reset collection
            this.collection.reset();

            // reset counter
            this.counter.reset();

            // show on screen info
            this._updateScreen();

            // remove from queue
            this.uploadbox.reset();

            // reset value for universal type drop-down
            this.select_extension.value(this.list_extensions[0]);
            this.select_genome.value(this.list_genomes[0]);

            // reset button
            this.ui_button.set('percentage', 0);
        }
    },

    // update uset
    _updateUser: function() {
        // backup current history
        this.current_user = Galaxy.currUser.get('id');
        this.current_history = null;
        if (this.current_user) {
            this.current_history = Galaxy.currHistoryPanel.model.get('id');
        }
    },

    // set screen
    _updateScreen: function () {
        /*
            update on screen info
        */

        // check default message
        if(this.counter.announce == 0){
            if (this.uploadbox.compatible())
                message = 'You can Drag & Drop files into this box.';
            else
                message = 'Unfortunately, your browser does not support multiple file uploads or drag&drop.<br>Some supported browsers are: Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+.'
        } else {
            if (this.counter.running == 0)
                message = 'You added ' + this.counter.announce + ' file(s) to the queue. Add more files or click \'Start\' to proceed.';
            else
                message = 'Please wait...' + this.counter.announce + ' out of ' + this.counter.running + ' remaining.';
        }

        // set html content
        $('#upload-info').html(message);

        /*
            update button status
        */

        // update reset button
        if (this.counter.running == 0 && this.counter.announce + this.counter.success + this.counter.error > 0)
            this.modal.enableButton('Reset');
        else
            this.modal.disableButton('Reset');

        // update upload button
        if (this.counter.running == 0 && this.counter.announce > 0)
            this.modal.enableButton('Start');
        else
            this.modal.disableButton('Start');

        // pause upload button
        if (this.counter.running > 0)
            this.modal.enableButton('Pause');
        else
            this.modal.disableButton('Pause');

        // select upload button
        if (this.counter.running == 0){
            this.modal.enableButton('Choose local file');
            this.modal.enableButton('Choose FTP file');
            this.modal.enableButton('Paste/Fetch data');
        } else {
            this.modal.disableButton('Choose local file');
            this.modal.disableButton('Choose FTP file');
            this.modal.disableButton('Paste/Fetch data');
        }

        // ftp button
        if (this.current_user && this.options.ftp_upload_dir && this.options.ftp_upload_site) {
            this.modal.showButton('Choose FTP file');
        } else {
            this.modal.hideButton('Choose FTP file');
        }

        // table visibility
        if (this.counter.announce + this.counter.success + this.counter.error > 0) {
            $(this.el).find('#upload-table').show();
        } else {
            $(this.el).find('#upload-table').hide();
        }
    },

    // calculate percentage of all queued uploads
    _upload_percentage: function(percentage, size) {
        return (this.upload_completed + (percentage * size)) / this.upload_size;
    },


    // template for extensions description
    _templateDescription: function(options) {
        if (options.description) {
            var tmpl = options.description;
            if (options.description_url) {
                tmpl += '&nbsp;(<a href="' + options.description_url + '" target="_blank">read more</a>)';
            }
            return tmpl;
        } else {
            return 'There is no description available for this file extension.';
        }
    },
    
    // load html template
    _template: function(id, idInfo) {
        return '<div id="upload-header" class="upload-header">' +
                    '<span class="header-title">Type (default):</span>' +
                    '<span id="header-extension"/>' +
                    '<span id="header-extension-info" class="upload-icon-button fa fa-search"/> ' +
                    '<span class="header-title">Genome (default):</span>' +
                    '<span id="header-genome"/>' +
                '</div>' +
                '<div id="' + id + '" class="upload-box">' +
                    '<table id="upload-table" class="table table-striped" style="display: none;">' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Name</th>' +
                                '<th>Size</th>' +
                                '<th>Type</th>' +
                                '<th>Genome</th>' +
                                '<th>Settings</th>' +
                                '<th>Status</th>' +
                                '<th></th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody></tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="upload-footer">' +
                    '<h6 id="' + idInfo + '" class="upload-info"></h6>' +
                '</div>' ;
    }
});

});
