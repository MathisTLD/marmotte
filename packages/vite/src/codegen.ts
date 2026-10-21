// Public re-export of the (internal, inlined) codegen helpers meant for plugin authors.
// The registry behind `registerCommentTypeResolver` lives in @mrmt/utils and is inlined in this
// package only, so there is a single instance shared with `VitePluginContext`.
export { registerCommentTypeResolver, type CommentType } from "@mrmt/utils/codegen";
