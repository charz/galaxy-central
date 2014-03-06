// dependencies
define(['plugin/models/groups'], function(Groups) {


// model
return Backbone.Model.extend(
{
    // defaults
    defaults : {
        id          : null,
        title       : '',
        type        : '',
        date        : null,
        state       : '',
        state_info  : ''
    },
    
    // initialize
    initialize: function(options)
    {
        this.groups = new Groups();
    },
    
    // reset
    reset: function()
    {
        this.clear({silent: true}).set(this.defaults);
        this.groups.reset();
        this.trigger('reset', this);
    },
    
    // copy
    copy: function(new_chart) {
        // copy chart/groups
        var current = this;
        current.set(new_chart.attributes);
        current.groups.reset();
        new_chart.groups.each(function(group) {
            current.groups.add(group.clone());
        });
        current.trigger('change', current);
    },
    
    state: function(value, info) {
        this.set('state_info', info);
        this.set('state', value);
    }
});

});