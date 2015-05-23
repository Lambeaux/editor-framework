// pixi-grid config
Editor.registerPanel( 'grid-demo.panel', {
    is: 'grid-demo',

    listeners: {
        'resize': '_onResize',
        'panel-show': '_onPanelShow',
        'keydown': '_onKeyDown',
        'keyup': '_onKeyUp',
    },

    ready: function () {
        // grid
        this.$.grid.setScaleH( [5,2,3,2], 1, 1000, 'frame' );
        // this.$.grid.setScaleH( [5,2], 0.01, 1000 );
        this.$.grid.setMappingH( 0, 100, 100 );

        this.$.grid.setScaleV( [5,2], 0.01, 1000 );
        this.$.grid.setMappingV( 100, -100, 200 );

        this.$.grid.setAnchor( 0.0, 0.5 );
    },

    _onResize: function ( event ) {
        this.$.grid.resize();
        this.$.grid.repaint();
    },

    _onPanelShow: function ( event ) {
        this.$.grid.resize();
        this.$.grid.repaint();
    },

    _onMouseWheel: function ( event ) {
        this.$.grid.scaleAction ( event );
    },

    _onMouseDown: function ( event ) {
        if ( event.which === 1 ) {
            if ( event.shiftKey ) {
                this.style.cursor = '-webkit-grabbing';
                EditorUI.startDrag('-webkit-grab', event,
                                   // move
                                   function ( event, dx, dy, offsetx, offsety ) {
                                       this.$.grid.pan( dx, dy );
                                       this.$.grid.repaint();
                                   }.bind(this),

                                   // end
                                   function ( event, dx, dy, offsetx, offsety ) {
                                       if ( event.shiftKey )
                                           this.style.cursor = '-webkit-grab';
                                       else
                                           this.style.cursor = '';
                                   }.bind(this));
                return;
            }
        }
    },

    _onKeyDown: function ( event ) {
        event.stopPropagation();

        if ( Editor.KeyCode(event.which) === 'shift' ) {
            this.style.cursor = '-webkit-grab';
        }
    },

    _onKeyUp: function ( event ) {
        event.stopPropagation();

        if ( Editor.KeyCode(event.which) === 'shift' ) {
            this.style.cursor = '';
        }
    },
});