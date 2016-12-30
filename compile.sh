#!/bin/bash

# WIP: This is a work in progress switch to compile production binary with
# closure compiler and possibly split the binaries into multiple modules.
# Use ./compile to check for warnings and errors when compiling.

CLOSURE_COMPILER_PATH=node_modules/splittable/third_party/closure-compiler/closure-compiler-1.0-SNAPSHOT.jar

mkdir -p dist/reports
mkdir -p dist/closure

java -jar $CLOSURE_COMPILER_PATH \
    --output_module_dependencies dist/reports/module-dependencies.json \
    --variable_renaming_report dist/reports/variable-renaming-report.txt \
    --property_renaming_report dist/reports/property-renaming-report.txt \
    --output_manifest dist/reports/files-manifest.txt \
    --compilation_level SIMPLE \
    --process_common_js_modules \
    --warning_level VERBOSE \
    --dependency_mode=STRICT \
    --entry_point src/entry.js \
    --js node_modules/google-closure-library/closure/goog/base.js \
    --js src/entry.js \
    --js src/defs.js \
    --js src/3rdparty/carbon3p.js \
    --js src/3rdparty/thirdPartyEmbed.js \
    --js src/article.js \
    --js src/component.js \
    --js src/customEventTarget.js \
    --js src/editor.js \
    --js src/errors.js \
    --js src/core/abstract-extension.js \
    --js src/core/operations/ops-from-html.js \
    --js src/extensions/copy-cut-paste/index.js \
    --js src/extensions/copy-cut-paste/copy-cut-paste.js \
    --js src/extensions/embedding/abstractEmbedProvider.js \
    --js src/extensions/attachment.js \
    --js src/extensions/embedding/carbonEmbedProvider.js \
    --js src/extensions/componentFactory.js \
    --js src/extensions/embedding/embeddedComponent.js \
    --js src/extensions/embedding/embeddingExtension.js \
    --js src/extensions/embedding/embedlyProvider.js \
    --js src/extensions/formattingExtension.js \
    --js src/extensions/giphy-search/giphy-search.js \
    --js src/extensions/iframeComponent.js \
    --js src/extensions/layoutingExtension.js \
    --js src/extensions/selfieExtension.js \
    --js src/extensions/shortcutsManager.js \
    --js src/extensions/toolbeltExtension.js \
    --js src/extensions/uploadExtension.js \
    --js src/extensions/vimeoComponent.js \
    --js src/extensions/vineComponent.js \
    --js src/extensions/youtubeComponent.js \
    --js src/figure.js \
    --js src/i18n/ar.js \
    --js src/i18n/en.js \
    --js src/i18n.js \
    --js src/layout.js \
    --js src/list.js \
    --js src/loader.js \
    --js src/paragraph.js \
    --js src/section.js \
    --js src/selection.js \
    --js src/toolbars/button.js \
    --js src/toolbars/textField.js \
    --js src/toolbars/toolbar.js \
    --js src/utils/dom.js \
    --js src/utils.js \
    --externs externs/webcam.externs.js \
    --output_wrapper '(function(){%output%})();' \
    --assume_function_wrapper \
    --export_local_property_definitions \
    --generate_exports \
    --process_closure_primitives


# Other options for the compiler.
    # --dependency_mode=STRICT \
    # --module_output_path_prefix dist/modules/ \
    # --compilation_level ADVANCED \

    # \
    # --js src/newmain.js \
    # --js src/i18n.js \
    # --js src/editor.js \
    # --module carbonmodule:2 \
    # --create_source_map %outname%.map \
    # \
    # --js src/i18n/ar.js \
    # --module ar:1:carbonmodule \
    # --js src/i18n/en.js \
    # --module en:1:carbonmodule \

    # \
    # --js src/extensions/youtubeComponent.js \
    # --module youtube:1:iframe: \

    # --entry_point carbon
    # --entry_point carbon.i18n.ar
    # --entry_point carbon.i18n.en
    # --js src/i18n/ar.js
    # --module
    # --js src/i18n/en.js
