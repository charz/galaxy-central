<%inherit file="/base.mako"/>
<%namespace file="/message.mako" import="render_msg" />


%if msg:
    ${render_msg( msg, messagetype )}
%endif

<% num_states=len(states_list) %>

<div class="toolForm">
    <div class="toolFormTitle">View request type details</div>
    <div class="toolFormBody">
        <form name="library" action="${h.url_for( controller='admin', action='request_type', save_changes=True, create=False, id=request_type.id, num_states=num_states )}" method="post" >
            <div class="form-row">
                <label>Name</label>
                ${request_type.name}
                <div style="clear: both"></div>
            </div>
            <div class="form-row">
                <label>Description</label>
                ${request_type.desc}
                <div style="clear: both"></div>
            </div>
            <div class="form-row">
                <label>
                    Request Form definition 
                </label>
                ${request_type.request_form.name}
            </div>       
            <div class="form-row">
                <label>
                    Sample Form definition 
                </label>
                ${request_type.sample_form.name}
            </div>    
            <div class="form-row">
                <label>
                    Possible states 
                </label>
                %for element_count, state in enumerate(states_list):
                    <div class="form-row">
                        <label>${1+element_count}. ${state.name}</label>
                        ${state.desc}
                    </div>
                    <div style="clear: both"></div>
                %endfor
            </div>
        </form>
    </div>
</div>