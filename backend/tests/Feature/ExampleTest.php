<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_serves_the_mockup_through_inertia(): void
    {
        $this->withoutVite();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('App')
                ->where('currentTab', 'overview')
                ->where('isRoot', true)
                ->where('showLogin', false)
                ->where('auth.user', null));
    }

    public function test_known_module_route_requires_authentication(): void
    {
        $this->get('/app/modul-a')
            ->assertRedirect('/login');
    }

    public function test_unknown_module_route_redirects_to_first_authorized_tab(): void
    {
        $user = User::factory()->create();
        $role = Role::query()->create([
            'name' => 'super_admin',
            'title' => 'Super Admin',
            'core_group' => 'superadmin',
            'default_tab' => 'overview',
        ]);
        $user->roles()->attach($role->id);

        $this->actingAs($user)->get('/app/unknown-module')
            ->assertRedirect('/app/targets');
    }
}
