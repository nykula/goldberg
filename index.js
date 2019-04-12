#!/usr/bin/env gjs
const { AppInfo, AppInfoCreateFlags } = imports.gi.Gio;
const {
  AccelFlags,
  AccelGroup,
  Application,
  ApplicationWindow,
  Box,
  Button,
  Entry,
  HeaderBar,
  IconSize,
  Image,
  Label,
  Notebook,
  PackType,
  ReliefStyle,
  WindowPosition
} = imports.gi.Gtk;
const { EllipsizeMode } = imports.gi.Pango;
const {
  FindOptions,
  ProcessModel,
  Settings,
  WebContext,
  WebView
} = imports.gi.WebKit2;

/** @param {any} [x] */ const ANY = x => x;
const state = {
  /** @type {Notebook} */ $tabs: ANY(),
  /** @type {Entry} */ $url: ANY(),
  /** @type {WebView} */ $web: ANY(),
  /** @type {{ $: WebView, _: (() => void)[] }} */ _$web: { $: ANY(), _: [] }
};
Object.defineProperty(state, "$web", {
  get: () => state._$web.$,
  set(/** @type {typeof state._$web.$} */ x) {
    state._$web.$ = x;
    state._$web._.map(y => y());
  }
});
/** @type {<T>(x: { connect: T }) => T} */
const on = x => ANY((/** @type {any[]} */ ...args) => x.connect(...args));
/** @param {{ icon_name: string }} props */
const ButtonNav = ({ icon_name }) =>
  new Button({
    focus_on_click: false,
    image: new Image({ icon_name, icon_size: IconSize.MENU }),
    relief: ReliefStyle.NONE
  });
const $app = new Application({ application_id: "org.js.goldberg" });
on($app)("activate", () => {
  WebContext.get_default().set_process_model(
    ProcessModel.MULTIPLE_SECONDARY_PROCESSES
  );
  const $win = new ApplicationWindow({
    application: $app,
    default_height: 600,
    default_width: 1024,
    title: "Goldberg",
    window_position: WindowPosition.CENTER
  });
  {
    const $accel = new AccelGroup();
    /** @param {string} xs @param {() => void} callback */
    const accel = (xs, callback) =>
      xs.split(";").map(x => {
        const [key, mod] = imports.gi.Gtk.accelerator_parse(x).map(Number);
        on($accel)(key, mod, AccelFlags.VISIBLE, () => (callback(), true));
      });
    accel("<Alt>Left", () => state.$web.go_back());
    accel("<Alt>Right", () => state.$web.go_forward());
    accel("<Alt>l;<Ctrl>f;<Ctrl>l;F6", () => state.$url.grab_focus());
    accel("<Ctrl>0", () => Zoom(1));
    accel("<Ctrl>equal", () => Zoom(state.$web.get_zoom_level() * 1.25));
    accel("<Ctrl>g;F3", () =>
      Find().get_search_text()
        ? (Find().search_next(), Js(Select))
        : state.$url.grab_focus()
    );
    accel("<Ctrl>Page_Down", () =>
      state.$tabs.get_current_page() === state.$tabs.get_n_pages() - 1
        ? state.$tabs.set_current_page(0)
        : state.$tabs.next_page()
    );
    accel("<Ctrl>Page_Up", () =>
      state.$tabs.get_current_page()
        ? state.$tabs.prev_page()
        : state.$tabs.set_current_page(state.$tabs.get_n_pages() - 1)
    );
    accel("<Ctrl>minus", () => Zoom(state.$web.get_zoom_level() / 1.25));
    accel("<Ctrl>r;F5", () => state.$web.reload());
    accel("<Ctrl>t", () => Blank());
    accel("<Ctrl>w", () => state.$web.destroy());
    accel("<Ctrl>z", () => Js("document.execCommand('undo', false, null)"));
    accel("<Shift><Ctrl>g;<Shift>F3", () =>
      Find().get_search_text()
        ? (Find().search_previous(), Js(Select))
        : state.$url.grab_focus()
    );
    accel("<Shift><Ctrl>z;<Ctrl>y", () =>
      Js("document.execCommand('redo', false, null)")
    );
    accel("Escape", () => {
      Find().search_finish();
      Find().search("", 0, 0);
      state.$web.grab_focus();
      state.$web.stop_loading();
      state.$web = state.$web;
    });
    $win.add_accel_group($accel);
  }
  {
    const $nav = new HeaderBar({ show_close_button: true });

    const $prev = ButtonNav({ icon_name: "go-previous-symbolic" });
    on($prev)("clicked", () => state.$web.go_back());
    state._$web._.push(() => ($prev.sensitive = state.$web.can_go_back()));
    $nav.add($prev);

    const $next = ButtonNav({ icon_name: "go-next-symbolic" });
    on($next)("clicked", () => state.$web.go_forward());
    state._$web._.push(() => ($next.sensitive = state.$web.can_go_forward()));
    $nav.add($next);

    const $refresh = ButtonNav({ icon_name: "view-refresh-symbolic" });
    on($refresh)("clicked", () => state.$web.reload());
    state._$web._.push(() => ($refresh.visible = !state.$web.is_loading));
    $nav.add($refresh);

    const $stop = ButtonNav({ icon_name: "process-stop-symbolic" });
    on($stop)("clicked", () => state.$web.stop_loading());
    state._$web._.push(() => ($stop.visible = state.$web.is_loading));
    $nav.add($stop);

    const $url = new Entry({ expand: true });
    on($url)("activate", () => {
      const x = $url.text;
      state.$web.grab_focus();
      state.$web.load_uri(
        x.search(/[/.:]/) === -1
          ? `https://duckduckgo.com/lite/?kd=-1&q=${encodeURIComponent(x)}`
          : x.indexOf("/") === 0
          ? `file://${x}`
          : x.indexOf(":/") === -1
          ? `https://${x}`
          : x
      );
    });
    on($url)("changed", () => {
      if ($url.has_focus) {
        Find().search($url.text, FindOptions.CASE_INSENSITIVE, 0);
        Js(Select);
      }
    });
    on($url)("focus-out-event", () => $url.select_region(0, 0));
    state._$web._.push(() => ($url.text = decodeURI(state.$web.uri || "")));
    $nav.custom_title = state.$url = $url;

    const $add = ButtonNav({ icon_name: "list-add-symbolic" });
    on($add)("clicked", () => Blank());
    state._$web._.push(() => ($add.visible = state.$tabs.get_n_pages() <= 1));
    $nav.pack_end($add);

    $win.set_titlebar($nav);
  }
  {
    const $tabs = new Notebook({ scrollable: true, show_border: false });
    on($tabs)("switch-page", (_, $web) => (state.$web = ANY($web)));
    state._$web._.push(() => ($tabs.show_tabs = $tabs.get_n_pages() > 1));
    const $add = ButtonNav({ icon_name: "list-add-symbolic" });
    on($add)("clicked", () => Blank());
    $add.margin_right = 5;
    $add.visible = true;
    $tabs.set_action_widget($add, PackType.END);
    $win.add((state.$tabs = $tabs));
  }
  $win.show_all();
  /** @param {WebView} $web */
  const Append = $web => {
    $web.visible = true;
    on($web)("destroy", () => state.$tabs.get_n_pages() || $win.destroy());
    const $box = new Box();
    const $label = new Label({ ellipsize: EllipsizeMode.END, hexpand: true });
    on($web)("notify::title", () => ($label.label = $web.title || $web.uri));
    $box.add(Object.assign($label, { label: "..." }));
    const $close = ButtonNav({ icon_name: "window-close-symbolic" });
    on($close)("clicked", () => $web.destroy());
    $box.add($close);
    $box.show_all();
    const i = state.$tabs.append_page(ANY($web), $box);
    state.$web = state.$web;
    return i;
  };
  const Blank = () => {
    state.$tabs.set_current_page(Append(Tab()));
    state.$url.grab_focus();
  };
  const Find = () => state.$web.get_find_controller();
  /** @param {string} x */
  const Js = x => state.$web.run_javascript(x, null, null);
  const Select =
    "for(let x=document.getSelection().focusNode;x=x.parentNode;)if(x.focus){x.focus();break;}";
  const Tab = () => {
    const ctx = WebContext.new_ephemeral();
    on(ctx)("download-started", (_, x) => {
      const opt = AppInfoCreateFlags.NEEDS_TERMINAL;
      const ai = AppInfo.create_from_commandline("wget %U", "wget", opt);
      ai.launch_uris([x.get_request().uri], null);
    });
    const settings = new Settings({ enable_developer_extras: true });
    settings.enable_smooth_scrolling = false;
    let $web = state.$web || null;
    $web = new WebView({ related_view: $web, settings, web_context: ctx });
    on($web)("create", () => state.$tabs.get_nth_page(Append(Tab())));
    on($web)("load-changed", () => state.$web === $web && (state.$web = $web));
    on($web)("mouse-target-changed", (_, x) => {
      if (!state.$url.has_focus) {
        state.$url.text =
          decodeURI(x.get_link_uri() || _.uri || "") || state.$url.text;
      }
    });
    on($web)("notify::uri", () => state.$web === $web && (state.$web = $web));
    return $web;
  };
  /** @param {number} x */
  const Zoom = x => state.$web.set_zoom_level(Number(x.toFixed(1)));
  Blank();
});
$app.run(ARGV);
ANY(window).exports = {};
exports.forceTsNoUnusedLocals = "random property on exports";
