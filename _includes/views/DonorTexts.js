views.DonorTexts = Backbone.View.extend({
    el:'#donor-specific',
    template: _.template($('#donorSpecific').html()),
    initialize: function(){
        this.render();
    },
    render: function(){
        var that = this;

        this.$el.html(this.template());

        this.$el.find('.spin').spin({ color:'#000' });

        _(this.$el.find('img')).each(function(img){
            var caption = $('<p class="photo-caption">'+img.alt+'</p>')
            caption.insertAfter(img);
            caption.prev().andSelf().wrapAll('<div class="slide" />');
        });
        $('.slide').wrapAll('<div id="slides" />');
        $('#slides', this.$el).slidesjs({
            pagination:{active:false},
            callback: {
                loaded: function(number) {
                    that.$el.find('.spin').remove();
                }
            }
        });
    }
})