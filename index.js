#!/usr/bin/gjs
const {
  AccelFlags,
  AccelGroup,
  Button,
  Entry,
  HeaderBar,
  IconSize,
  Image,
  ReliefStyle,
  Window,
  WindowPosition
} = imports.gi.Gtk;
const { WebView } = imports.gi.WebKit2;

imports.gi.Gtk.init(null);
/** @type {any} */ const REF = undefined;
const state = {
  /** @type {Button} */ $next: REF,
  /** @type {Button} */ $previous: REF,
  /** @type {Entry} */ $url: REF,
  /** @type {WebView} */ $web: REF
};
const $win = new Window({
  default_height: 600,
  default_width: 1024,
  title: "Goldberg",
  window_position: WindowPosition.CENTER
});
$win.connect(
  "destroy",
  () => imports.gi.Gtk.main_quit()
);
{
  const $accel = new AccelGroup();
  /** @param {string} xs @param {() => void} callback */
  const accel = (xs, callback) =>
    xs.split(";").map(x => {
      const [key, mod] = imports.gi.Gtk.accelerator_parse(x).map(Number);
      $accel.connect(
        key,
        mod,
        AccelFlags.VISIBLE,
        callback
      );
    });
  accel("<Ctrl>l;<Meta>l;F6", () => (state.$url.grab_focus(), true));
  accel("<Ctrl>r;F5", () => state.$web.reload());
  accel("<Meta>l", () => (state.$url.grab_focus(), true));
  accel("<Meta>Left", () => state.$web.go_back());
  accel("<Meta>Right", () => state.$web.go_forward());
  $win.add_accel_group($accel);

  const $nav = new HeaderBar({ show_close_button: true });
  {
    /** @param {{ icon_name: string }} props */
    const NavButton = ({ icon_name }) =>
      new Button({
        focus_on_click: false,
        image: new Image({ icon_name, icon_size: IconSize.MENU }),
        relief: ReliefStyle.NONE
      });
    const $previous = NavButton({ icon_name: "go-previous-symbolic" });
    $previous.connect(
      "clicked",
      () => state.$web.go_back()
    );
    state.$previous = $previous;
    $nav.add($previous);

    const $next = NavButton({ icon_name: "go-next-symbolic" });
    $next.connect(
      "clicked",
      () => state.$web.go_forward()
    );
    state.$next = $next;
    $nav.add($next);

    const $refresh = NavButton({ icon_name: "view-refresh-symbolic" });
    $refresh.connect(
      "clicked",
      () => state.$web.reload()
    );
    $nav.add($refresh);
  }

  const $url = new Entry({ expand: true });
  $url.connect(
    "activate",
    () => {
      let url = $url.get_text();
      url = /^\w+:/.test(url) ? url : `https://${url}`;
      $url.set_text(url);
      state.$web.load_uri(url);
    }
  );
  $url.connect(
    "focus-out-event",
    () => $url.select_region(0, 0)
  );
  state.$url = $url;
  $nav.custom_title = $url;
  $win.set_titlebar($nav);

  const $web = new WebView();
  $web.get_settings().enable_developer_extras = true;
  $web.connect(
    "load-changed",
    () => {
      state.$previous.sensitive = $web.can_go_back();
      state.$next.sensitive = $web.can_go_forward();
      state.$url.text = $web.get_uri();
    }
  );
  state.$web = $web;
  $win.add(/** @type {any} */ ($web));
}
$win.show_all();
state.$web.load_uri("https://example.com/");

imports.gi.Gtk.main();
/** @type {any} */ (window).exports = {};
exports.forceTsNoUnusedLocals = "random property on exports";
