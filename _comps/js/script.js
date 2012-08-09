$(function(){

    var template  = _.template(
        '<tr>' +
            '<td><%= project %></td>' +
            '<td><%= budget %></td>' +
            '<td><%= status %></td>' +
        '</tr>'
    );

    var rows = [];

    _(PROJECTS).each(function(project) {
        rows.push(template(project));
    });

    $('#items').append(
        '<table class="table table-condensed">' +
            '<thead>' +
                '<tr>' +
                    '<th>Project</th>' +
                    '<th>Budget</th>' +
                    '<th>Status</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                rows.join('') +
            '</tbody>' +
        '</table>'
    );

});