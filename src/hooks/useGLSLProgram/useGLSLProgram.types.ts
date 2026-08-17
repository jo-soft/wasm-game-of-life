export type CompileShaderSuccess = [WebGLShader, null];
export type CompileShaderError = [null, string];
export type CompileShaderResult = CompileShaderSuccess | CompileShaderError;

export type UseShaderHookResultSuccess = [WebGLProgram, null];
export type UseShaderHookResultError = [null, string];
export type UseShaderHookResult = UseShaderHookResultSuccess | UseShaderHookResultError;
