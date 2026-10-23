<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_code',
        'name',
        'username',
        'email',
        'nip',
        'password',
        'organization',
        'scope_level',
        'scope_name',
        'province_id',
        'district_id',
        'institution_id',
        'employer_id',
        'mfa_enabled',
        'mfa_secret',
        'status',
        'avatar_initials',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'nip',
        'mfa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_enabled' => 'boolean',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->wherePivot('model_type', self::class);
    }

    public function canAccessTab(string $tab): bool
    {
        $roleName = $this->roles->first()?->name;

        if ($roleName === 'super_admin') {
            return true;
        }

        $accessibleTabs = match ($roleName) {
            'leadership' => ['overview', 'dashboard', 'sippmi-monitoring', 'audit'],
            'task_force' => ['overview', 'dashboard', 'modul-a', 'modul-b', 'modul-c', 'modul-d', 'matching', 'modul-e', 'approvals', 'audit', 'sippmi-monitoring'],
            'directorate_admin' => ['overview', 'dashboard', 'modul-b', 'modul-c', 'matching', 'modul-e', 'sippmi-monitoring'],
            'province_admin', 'district_admin' => ['overview', 'dashboard', 'modul-a', 'approvals'],
            'bp3mi_admin', 'placement_officer' => ['overview', 'dashboard', 'matching', 'modul-e', 'sippmi-monitoring'],
            'institution_admin' => ['overview', 'dashboard', 'modul-b', 'modul-c', 'approvals'],
            'demand_admin' => ['overview', 'dashboard', 'modul-d', 'approvals'],
            'verifier' => ['overview', 'dashboard', 'modul-a', 'modul-b', 'modul-c', 'modul-d', 'approvals', 'audit'],
            'training_operator' => ['overview', 'dashboard', 'modul-b'],
            'auditor' => ['overview', 'dashboard', 'audit', 'sippmi-monitoring'],
            default => [],
        };

        return in_array($tab, $accessibleTabs, true);
    }
}
