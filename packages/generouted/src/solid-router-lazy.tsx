/** @jsxImportSource solid-js */
import { Component, createMemo, lazy, ParentProps } from 'solid-js'
import { RouteDataFunc, RouteDataFuncArgs, RouteDefinition, Router, useLocation, useRoutes } from '@solidjs/router'

import { generateModalRoutes, generatePreservedRoutes, generateRegularRoutes, generatePathForGroup } from './core'

type Module = { default: Component; Loader: RouteDataFunc }
type Route = { path?: string; component?: Component; children?: Route[] }

const PRESERVED = import.meta.glob<Module>('/src/pages/(_app|404).{jsx,tsx}', { eager: true })
const MODALS = import.meta.glob<Pick<Module, 'default'>>('/src/pages/**/[+]*.{jsx,tsx}', { eager: true })
const ROUTES = import.meta.glob<Module>(['/src/pages/**/[\\w[-]*.{jsx,tsx}', '!**/(_app|404).*'])

const preservedRoutes = generatePreservedRoutes<Component>(PRESERVED)
const modalRoutes = generateModalRoutes<Element>(MODALS)

const regularRoutes = generateRegularRoutes<Route, () => Promise<Module>>(ROUTES, (module) => ({
  component: lazy(module),
  data: (args: RouteDataFuncArgs) => module().then((mod) => mod?.Loader?.(args) || null),
}))
regularRoutes.forEach((route) => generatePathForGroup(route))

const Fragment = (props: ParentProps) => props?.children
const App = preservedRoutes?.['_app'] || Fragment
const NotFound = preservedRoutes?.['404'] || Fragment
const Modals = () => createMemo(() => modalRoutes[useLocation<{ modal: string }>().state?.modal || ''] || Fragment)

export const routes = [...regularRoutes, { path: '*', component: NotFound }] as RouteDefinition[]

export const Routes = () => {
  const Routes = useRoutes(routes)

  return (
    <Router>
      <App>
        <Routes />
        <Modals />
      </App>
    </Router>
  )
}
