// dependencies
define(['mvc/ui/ui-tabs', 'plugin/library/table', 'plugin/library/ui', 'utils/utils', 'plugin/models/chart', 'plugin/models/group', 'plugin/views/group'],
    function(Tabs, Table, Ui, Utils, Chart, Group, GroupView) {

// widget
return Backbone.View.extend(
{
    // defaults options
    optionsDefault: {
        header  : true,
        content : 'No content available.'
    },
    
    // initialize
    initialize: function(app, options)
    {
        // link application
        this.app = app;
        
        // get current chart object
        this.chart = this.app.chart;
        
        // configure options
        this.options = Utils.merge(options, this.optionsDefault);
        
        // main elements
        this.message = new Ui.Message();
        this.title = new Ui.Input({placeholder: 'Chart title'});
        this.dataset = new Ui.Input({value : app.options.dataset.id, disabled: true, visible: false});
        
        //
        // table with chart types
        //
        var self = this;
        this.table = new Table({
            header : false,
            onconfirm : function(type) {
                if (self.chart.groups.length > 0) {
                    // show modal
                    self.app.modal.show({
                        title   : 'Switching the chart type?',
                        body    : 'If you continue your data selections will cleared.',
                        buttons : {
                            'Cancel'    : function() {
                                // hide modal
                                self.app.modal.hide();
                            },
                            'Continue'  : function() {
                                // hide modal
                                self.app.modal.hide();
                                
                                // confirm
                                self.table.value(type);
                            }
                        }
                    });
                } else {
                    // confirm
                    self.table.value(type);
                }
            },
            onchange : function(type) {
                // update chart type
                self.chart.set({type: type});
                    
                // reset groups
                self.chart.groups.reset();
            },
            content: 'No chart types available'
        });
        
        // load chart types into table
        var types_n = 0;
        var types = app.types.attributes;
        for (var id in types){
            var chart_type = types[id];
            this.table.add (++types_n + '.');
            this.table.add (chart_type.title);
            this.table.append(id);
        }
        
        //
        // tabs
        //
        this.tabs = new Tabs.View({
            title_new       : 'Add Data',
            onnew           : function() {
                var group = self._addGroupModel();
                self.tabs.show(group.id);
            },
            operations      : {
                'save'  : new Ui.ButtonIcon({
                            icon    : 'fa-save',
                            tooltip : 'Draw Chart',
                            title   : 'Draw',
                            onclick : function() {
                                // ensure that data group is available
                                if (self.chart.groups.length == 0) {
                                    self._addGroupModel();
                                }
                                
                                // save chart
                                self._saveChart();
                            }
                        }),
                'back'  : new Ui.ButtonIcon({
                            icon    : 'fa-caret-left',
                            tooltip : 'Return to Viewer',
                            title   : 'Return',
                            onclick : function() {
                                self.$el.hide();
                                self.app.charts_view.$el.show();
                            }
                        })
            }
        });
        
        // construct element
        var $settings = $('<div/>');
        $settings.append(Utils.wrap(this.message.$el));
        $settings.append(Utils.wrap((new Ui.Label({ title : 'Provide a chart title:'})).$el));
        $settings.append(Utils.wrap(this.title.$el));
        $settings.append(Utils.wrap((new Ui.Label({ title : 'Select a chart type:'})).$el));
        $settings.append(Utils.wrap(this.table.$el));
        
        // add tab
        this.tabs.add({
            id      : 'settings',
            title   : 'Start',
            $el     : $settings
        });
        
        // elements
        this.setElement(this.tabs.$el);
        
        // hide back button on startup
        this.tabs.hideOperation('back');
        
        // chart events
        var self = this;
        this.chart.on('change:title', function(chart) {
            self.title.value(chart.get('title'));
        });
        this.chart.on('change:type', function(chart) {
            self.table.value(chart.get('type'));
        });
        this.chart.on('reset', function(chart) {
            self._resetChart();
        });
        
        // charts events
        this.app.charts.on('add', function(chart) {
            self.tabs.showOperation('back');
        });
        this.app.charts.on('remove', function(chart) {
            if (self.app.charts.length == 1) {
                self.tabs.hideOperation('back');
            }
        });
        this.app.charts.on('reset', function(chart) {
            self.tabs.hideOperation('back');
        });
        
        // groups events
        this.app.chart.groups.on('add', function(group) {
            self._addGroup(group);
        });
        this.app.chart.groups.on('remove', function(group) {
            self._removeGroup(group);
        });
        this.app.chart.groups.on('reset', function(group) {
            self._removeAllGroups();
        });
        this.app.chart.groups.on('change:label', function(group) {
            self._refreshLabels();
        });
        
        // reset
        this._resetChart();
    },

    // update
    _refreshLabels: function() {
        var self = this;
        var counter = 0;
        this.chart.groups.each(function(group) {
            var title = group.get('label', '');
            if (title == '') {
                title = 'Chart data';
            }
            self.tabs.title(group.id, ++counter + ': ' + title);
        });
    },
    
    // new group
    _addGroupModel: function() {
        var group = new Group({
            id          : Utils.uuid(),
            dataset_id  : this.chart.get('dataset_id')
        });
        this.chart.groups.add(group);
        return group;
    },

    // add group
    _addGroup: function(group) {
        // link this
        var self = this;
        
        // create view
        var group_view = new GroupView(this.app, {group: group});
        
        // number of groups
        var count = self.chart.groups.length;
        
        // add new tab
        this.tabs.add({
            id              : group.id,
            $el             : group_view.$el,
            ondel           : function() {
                self.chart.groups.remove(group.id);
            }
        });
        
        // update titles
        this._refreshLabels()
    },
    
    // remove group
    _removeGroup: function(group) {
        this.tabs.del(group.id);
        
        // update titles
        this._refreshLabels()
    },

    // remove group
    _removeAllGroups: function(group) {
        this.tabs.delRemovable();
    },
    
    // reset
    _resetChart: function() {
        // reset chart details
        this.chart.set('id', Utils.uuid());
        this.chart.set('dataset_id', this.app.options.dataset.id);
        this.chart.set('type', 'bardiagram');
        this.chart.set('title', 'Chart title');
    },
    
    // create chart
    _saveChart: function() {
        // update chart data
        this.chart.set({
            type        : this.table.value(),
            title       : this.title.value(),
            dataset_id  : this.dataset.value(),
            date        : Utils.time()
        });
        
        // validate
        if (!this.chart.get('title')) {
            this.message.update({message : 'Please enter a title for your chart.'});
            return;
        }
        
        if (!this.chart.get('type')) {
            this.message.update({message : 'Please select a chart type.'});
            return;
        }

        if (this.chart.groups.length == 0) {
            this.message.update({message : 'Please configure at least one data source.'});
            return;
        }
        
        // create/get chart
        var current = this.app.charts.get(this.chart.id);
        if (!current) {
            current = this.chart.clone();
            this.app.charts.add(current);
        }
                
        // update chart model
        current.copy(this.chart);
        
        // hide
        this.$el.hide();
        
        // update main
        this.app.charts_view.$el.show();
    }
});

});