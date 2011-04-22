//check to make sure comments are in expected structure?

var valid = true;

//abort if not (could seriously break the page)

if (valid)
{
    nestComments();
}

/****************************************************
 *                                                  *
 *  Comment nesting                                 *
 *                                                  *
 ****************************************************/

function nestComments()
{
    var comments = {};
    var max = 0;
    var nests = {};

    $(".comment:not(.collapsed) .commentNumber").each(function(i, e)
    {
        //create a map of comment number to comment
        var n = parseInt(e.innerHTML);
        comments[n] = $(e).parent().parent();
    
        //get the highest comment number
        //for reverse iteration
        max = Math.max(max, n);
        
        //create a reply nest for each comment
        var nest = $(document.createElement('div'))
            .attr('id', comments[n].attr('id') + '-nest')
            .css('margin-left', '40px')
            .css('min-width', '260px')
            .addClass('nest')
            .insertAfter(comments[n]);

        nests[n] = nest;
    });
    
    //match replies in "#N" or "@N" format
    //also matches variants of "@N and M"
    var replyRegExp = /[#@] ?([0-9]+(?: ?(?:,|\/|and|&) ?[0-9]+)*)/g;
    var splitRegExp = / ?(?:,|\/|and|&) ?/;

    //loop through comments in reverse order
    for (var n = max; n > 0; n--)
    {
        //handle missing comments
        if (comments[n] == undefined)
        {
            continue;
        }

        var commentBody = $(".commentBody", comments[n])
        var parents = [];
        var match;

        //search for @N or #N references
        while ((match = replyRegExp.exec(commentBody.html())) != null)
        {
            //account for multiple references in one @/#
            var matches = match[1].split(splitRegExp);
            for (var i in matches) {
                var inReplyTo = parseInt(matches[i]);

                //avoid false positives and circular references
                if (inReplyTo < n && comments[inReplyTo] != undefined)
                {
                    //index by inReplyTo to avoid duplicating replies
                    parents[inReplyTo] = inReplyTo;
                }
            }
        }

        //nest the comment
        if (parents.length > 0)
        {
            for (p in parents)
            {
                //clone comment's nest
                var nestClone = nests[n].clone() 
                  .attr('id', parents[p] + '-' + nests[n].attr('id')); //assign new id

                //reassign ids inside nest
                $('.comment, .nest', nestClone).each(
                    function(i) {
                        $(this).attr('id', parents[p] + '-' + $(this).attr('id'));
                    }
                );

                //clone comment
                var commentClone = comments[n].clone()
                    .attr('id', parents[p] + '-' + comments[n].attr('id')); //assign new id

                //clone collapsed comment
                var collapsed = $('#' + comments[n].attr('id') + '-collapsed');
                
                var collapsedClone = collapsed.clone()
                    .attr('id', p + '-' + comments[n].attr('id') + '-collapsed'); //assign new id

                //make sure the expander acts on the correct comment
                var expander = $('a:first', collapsedClone);

                //using .attr('onclick', ...) or .removeAttr('onclick') is causing some
                //kind of conflict in a greasemonkey sandbox, so use the raw DOM
                expander.get(0).setAttribute('onclick', '');

                //using jQuery events simply doesn't work after the cloning process
                /*
                expander.click(function expand(event) {
                    $(event.target).parent().hide();
                    $(event.target).parent().next().fadeIn(0.5);
                });
                */

                //instead use The Stranger's prototype install with an onclick attribute
                expander.get(0).setAttribute('onclick', '$(this).up().hide();$(this).up().next().appear({duration:0.5});');

                //prepend everying to the parent's reply nest
                nests[p]
                    .prepend(nestClone)
                    .prepend(commentClone)
                    .prepend(collapsedClone);
            }
        }
    }
    //collapse all but the first instance of a comment
    var appeared = {};
    
    $(".comment:not(.collapsed) .commentNumber").each(function(i, e)
    {
        var n = parseInt(e.innerHTML);
        
        if (appeared[n] == undefined) {
            appeared[n] = true;
        }
        else {
            var comment = $(e).parent().parent();
            var commentId = comment.attr('id');
            
            var nestId = commentId + '-nest';
            var nest = $('#' + nestId);
            
            var collapsedId = commentId + '-collapsed';
            var collapsed = $('#' + collapsedId);
            
            //collapse comment in place
            comment.hide();
            
            nest.hide();

            //and give a message as to why it's collapsed
            collapsed
                .append($(document.createElement('p'))
                .css('text-align', 'left')
                    .append($(document.createElement('small'))
                        .html('The comment above is nested elsewhere')));

            collapsed.show();
        }
    });
}

/*
var message = $(document.createElement('small'))
        .html('The above comment is nested below comment'
            + (parents.length > 1 ? '(s)' : ''));

for (p in parents)
{
    var anchor = $('a:first', comments[parents[p]]).attr('name');

    message
        .append(document.createTextNode(' '))
        .append($(document.createElement('a'))
            .attr('href', '#' + anchor)
            .html(parents[p])
        );
}

collapsed.append($(document.createElement('p')).append(message));
*/