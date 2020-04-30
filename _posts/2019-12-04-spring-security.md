---
layout: post
title: Spring Security
subtitle: Introduction to Spring Security
keyword: Java, Spring Security
tag:
    - Java, Java EE, Spring Security
---

# Spring Security

## 引言

身份验证 (Authentication) 在很多 web 项目当中都有需求，在 Java-based 的项目里，常用的验证框架有下面两个：

- [Spring Security](https://spring.io/projects/spring-security)
- [Apache Shiro](https://shiro.apache.org/)

本文讨论 Spring Security 框架 (下文简称 SS 框架) 通过 SpringBoot 配置在**前后端分离**架构下的应用。

> 前后分离架构，指后端完全按照 RESTful 风格提供接口，页面渲染完全由前端负责。

## 框架概览

Spring Security 框架主要提供两个功能：

- Authentication: who you are?
- Authorization: what you are allowed to do?

本文主要关注 Authentication，Authorization 暂时不在讨论之内。在分析 SS 框架之前，先看看 SS 框架在整个 Spring 系列里处于什么地位 (SS 可以用于非 Web 的环境下，但是本文只讨论其在 Web 环境下的功能)。

我们知道在 Java Web 开发里，请求是由 `Servlet` 来处理的，而请求到达 `Servlet` 之前需要先经一系列的 `Filter`，如下图所示。

<img src="https://github.com/spring-guides/top-spring-security-architecture/raw/master/images/filters.png" alt="Filter 和 Servlet 的关系" width="500" />

Spring 系列会有自己的几个顶级 `Filter`，SS 框架本身被做成了其中的一个叫做 `FilterChainProxy`。然后这个 `Filter` 里面有有一系列的“子过滤器”，概念图可以如下所示。

<img src="https://github.com/spring-guides/top-spring-security-architecture/raw/master/images/security-filters.png" alt="Filter 和 Servlet 的关系" width="500" />

一个网络请求 (request) 想要达到处理它的 `Servlet` (在 Spring 应用程序员的层面说就是你编写的`Controller`) 之前，需要用过各种各样的 `Filter`。这些过滤器的作用包括但不仅限于验证你的权限，对 request 的 header 进行一些处理 (增加一些内容或者改动一些内容) 等。有了这个概念，下面进行 SS 框架的一些具体分析。

## 核心组件

### SecurityContextHolder

`SecurityContextHolder` 用于存储安全上下文，实现上采用了策略模式 (strategy pattern) 来设计，默认策略是 TheadLocal。顾名思义，这是一个线程绑定策略，用户登录时自动绑定认证信息到当前线程，在用户退出时，自动清除当前线程的认证信息。

因为身份信息是与线程绑定的，所以可以在程序的任何地方使用静态方法获取用户信息。一个典型的获取当前登录用户的姓名的例子如下所示：

```java
Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
if (principal instanceof UserDetails) {
    String username = ((UserDetails)principal).getUsername();
} else {
    String username = principal.toString();
}
```

我们知道对于每一个 request，Spring 会用一个线程去服务它。那么问题就来了，是不是我们每一次访问一个需要身份验证的页面都要登录一次呢。换言之，我们是否可以在 requests 之间保存 `SecurityContext`。答案当然是可以的，这个工作是由 `SecurityContextPersistenceFilter` 来进行的，默认行为是将安全上下文保存在 `HttpSession` 当中。

```java
// 这里只保留了一些关键步骤的代码
public class SecurityContextPersistenceFilter extends GenericFilterBean {
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;
        request.setAttribute(FILTER_APPLIED, Boolean.TRUE);
        if (forceEagerSessionCreation) {
            HttpSession session = request.getSession();
        }
        HttpRequestResponseHolder holder = new HttpRequestResponseHolder(request,
                response);
        SecurityContext contextBeforeChainExecution = repo.loadContext(holder);
        try {
            SecurityContextHolder.setContext(contextBeforeChainExecution);
            chain.doFilter(holder.getRequest(), holder.getResponse());
        }
        finally {
            SecurityContext contextAfterChainExecution = SecurityContextHolder
                    .getContext();
            // Crucial removal of SecurityContextHolder contents - do this before anything else.
            SecurityContextHolder.clearContext();
            repo.saveContext(contextAfterChainExecution, holder.getRequest(),
                    holder.getResponse());
            request.removeAttribute(FILTER_APPLIED);
        }
    }
}
```

### Authentication

`Authentication` 是一个接口，它可以代表两个概念：

- 一个请求中待验证的身份令牌
- 一个已经验证过的身份

```java
package org.springframework.security.core;
public interface Authentication extends Principal, Serializable {
    Collection<? extends GrantedAuthority> getAuthorities();  // 权限
    Object getCredentials();    // 用户输入的密码
    Object getDetails();        // 可以获取 IP 和 Session [web app.]
    Object getPrincipal();      // 身份信息
    boolean isAuthenticated();  // 是否已经被认证
    void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException;
}
```

### AuthenticationManager

`AuthenticationManager` 是一个仅包含一个方法的接口，它的作用是对一个将用户输入封装成的 `Authentication` (或者叫 `token` ) 进行验证，然后返回一个已经验证好的 `Authentication` 对象。

```java
package org.springframework.security.authentication;
public interface AuthenticationManager {
  Authentication authenticate(Authentication authentication)
            throws AuthenticationException;
}
```

这个接口最常用的实现是 `ProviderManager`，它将身份验证委托给一系列的 `AuthenticationProvider` 实例，只要其中的一个验证通过，那么这个身份就会被认为是通过验证的。

```java
package org.springframework.security.authentication;
public interface AuthenticationProvider {
    Authentication authenticate(Authentication authentication)
            throws AuthenticationException;
    boolean supports(Class<?> authentication);
}
```

```java
package org.springframework.security.authentication;
public class ProviderManager implements AuthenticationManager,
    MessageSourceAware, InitializingBean {
    private List<AuthenticationProvider> providers = Collections.emptyList();
    public Authentication authenticate(Authentication authentication)
            throws AuthenticationException {
        ...
        for (AuthenticationProvider provider : getProviders()) {
            if (!provider.supports(toTest)) {
                continue;
            }
            result = provider.authenticate(authentication);
            ...
        }
    }
}
```

## 认证流程

对于最常见的表单登录 (form login)，SS 框架的处理流程如下：

1. 用户名和密码被封装成 `Authentication`，通常情况下， 是它具体实现类 `UsernamePasswordAuthenticationToken`；
2. 由一个 `AuthenticationManager` 来验证【步骤 1】构建的 `Authentication`；
3. 认证后，`AuthenticationManager` 身份管理器返回一个被填充满了信息的 `Authentication` 实例；
4. 将【步骤 3】中的 `Authentication`，设置 `SecurityContextHolder` 中；

下面看看这些步骤的源码，先忽略这些方法在哪里被调用。

```java
// 这里只保留了一些关键步骤的代码
package org.springframework.security.web.authentication;
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean
        implements ApplicationEventPublisherAware, MessageSourceAware {

    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        Authentication authResult;
        // 注意, 步骤【1～3】都在这方法里, 源码下一个代码框中
        authResult = attemptAuthentication(request, response);
        if (authResult == null) {
            // return immediately as subclass has indicated that it hasn't completed
            // authentication
            return;
        }
        successfulAuthentication(request, response, chain, authResult);
    }

    protected void successfulAuthentication(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain, Authentication authResult)
            throws IOException, ServletException {
        // [步骤 4]
        SecurityContextHolder.getContext().setAuthentication(authResult);
        rememberMeServices.loginSuccess(request, response, authResult);

        // Fire event
        if (this.eventPublisher != null) {
            eventPublisher.publishEvent(new InteractiveAuthenticationSuccessEvent(
                authResult, this.getClass()));
        }
        successHandler.onAuthenticationSuccess(request, response, authResult);
    }
}
```

```java
// 这里只保留了一些关键步骤的代码
package org.springframework.security.web.authentication;
public class UsernamePasswordAuthenticationFilter extends
        AbstractAuthenticationProcessingFilter {

    public Authentication attemptAuthentication(HttpServletRequest request,
            HttpServletResponse response) throws AuthenticationException {
        String username = obtainUsername(request);
        String password = obtainPassword(request);
        // [步骤 1]
        UsernamePasswordAuthenticationToken authRequest = new UsernamePasswordAuthenticationToken(
                 username, password);
        setDetails(request, authRequest);
        // [步骤 2~3]
        return this.getAuthenticationManager().authenticate(authRequest);
    }
}
```

## 框架应用

使用这个框架的核心是写一个类继承自 `WebSecurityConfigurerAdapter` 来进行必要的配置。

```java
@EnableWebSecurity // #1
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    // #2
    @Override
    protected void configure(AuthenticationBuilder auth) throws Exception {
        auth
            .inMemoryAuthentication()
            .withUser("Eric").password("{noop}12345").roles("USER")；
    }

    // #3
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests(authorizeRequests ->
                authorizeRequests
                    .antMatchers("/css/**", "/index").permitAll()
                    .antMatchers("/user/**").hasRole("USER")
            )
            .formLogin(formLogin ->
                formLogin
                    .loginPage("/login")
                    .failureUrl("/login-error")
            );
    }
}
```

这里看重要的有三个点分别用 `#` 标注出来了，一个注解和两个覆盖超类的方法。

### EnableWebSecurity 注解

该注解的定义如下所示，可以看成是一个组合注解。首先，它通过 `@Import` 注解引入了 `WebSecurityConfiguration` 。然后，它还通过 `@EnableGlobalAuthentication` 引入了 `AuthenticationConfiguration`。

```java
@Retention(value = java.lang.annotation.RetentionPolicy.RUNTIME)
@Target(value = { java.lang.annotation.ElementType.TYPE })
@Documented
@Import({ WebSecurityConfiguration.class,
        SpringWebMvcImportSelector.class,
        OAuth2ImportSelector.class })
@EnableGlobalAuthentication
@Configuration
public @interface EnableWebSecurity {
    boolean debug() default false;
}

@Import(AuthenticationConfiguration.class)
@Configuration
public @interface EnableGlobalAuthentication {
}
```

也就是说：`@EnableWebSecurity` 完成的工作便是加载了 `WebSecurityConfiguration`，`AuthenticationConfiguration` 这两个核心配置类。

`WebSecurityConfiguration` 的主要作用就是注册了名为的一个 `springSecurityFilterChain` bean。

```java
package org.springframework.security.config.annotation.web.configuration;

@Configuration(proxyBeanMethods = false)
public class WebSecurityConfiguration implements ImportAware, BeanClassLoaderAware {

    @Bean(name = AbstractSecurityWebApplicationInitializer.DEFAULT_FILTER_NAME)
    public Filter springSecurityFilterChain() throws Exception {
        boolean hasConfigurers = webSecurityConfigurers != null
            && !webSecurityConfigurers.isEmpty();
        if (!hasConfigurers) {
        WebSecurityConfigurerAdapter adapter = objectObjectPostProcessor
            .postProcess(new WebSecurityConfigurerAdapter() {
            });
        webSecurity.apply(adapter);
        }
        return webSecurity.build();
    }
}
```

`AuthenticationConfiguration` 的主要任务，便是负责生成全局的身份认证管理者 `AuthenticationManager`。

```java
@Configuration
@Import(ObjectPostProcessorConfiguration.class)
public class AuthenticationConfiguration {
    @Bean
    public AuthenticationManagerBuilder authenticationManagerBuilder(
            ObjectPostProcessor<Object> objectPostProcessor) {
        return new AuthenticationManagerBuilder(objectPostProcessor);
    }

    public AuthenticationManager getAuthenticationManager() throws Exception {
        ...
        AuthenticationManagerBuilder authBuilder = this.applicationContext.getBean(AuthenticationManagerBuilder.class);
        ...
        authenticationManager = authBuilder.build();
        ...
        return authenticationManager;
    }
}
```

### Config 方法

给出的例子里主要提到了两个方法：

- `protected void configure(AuthenticationBuilder auth)`，可以替换框架默认的 `AuthenticationManager`；

- `protected void configure(HttpSecurity http)`，对需要认证的 HTTP 请求作出配置；

还有一个例子上没有提到的方法：

- `protected void configure(WebSecurity web)`，进行 web 层面的配置。例如，忽略静态资源的请求；

## 参考资料

https://docs.spring.io/spring-security/site/docs/5.2.2.BUILD-SNAPSHOT/reference/htmlsingle/

https://spring.io/guides/topicals/spring-security-architecture

https://www.cnkirito.moe/categories/Spring-Security/
