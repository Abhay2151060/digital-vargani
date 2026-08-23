import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { MandalsModule } from './mandals/mandals.module';
import { MembersModule } from './members/members.module';
import { DonationsModule } from './donations/donations.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { TransparencyModule } from './transparency/transparency.module';
import { ReportsModule } from './reports/reports.module';
import { RlsContextMiddleware } from './common/middleware/rls-context.middleware';

@Module({
  imports: [
    DbModule,
    AuthModule,
    MandalsModule,
    MembersModule,
    DonationsModule,
    ExpensesModule,
    ReconciliationModule,
    TransparencyModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RlsContextMiddleware).forRoutes('*');
  }
}
